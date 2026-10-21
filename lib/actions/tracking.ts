"use server";

import { headers } from "next/headers";
import { rateLimit } from "@/lib/rateLimit";
import { contactMatches, normalizeOrderNumber } from "@/lib/orders/tracking";
import { findOrderForTracking, toTrackedOrder, type TrackedOrder } from "@/lib/orders/trackedOrder";
import { makeTrackingToken, trackingChannel } from "@/lib/orders/liveTracking";

export type { TrackedOrder };

export type TrackOrderState =
  | null
  // live : de quoi suivre la commande en temps réel sans redemander l'email
  // (voir lib/orders/liveTracking.ts) ; absent si aucune clé n'est configurée.
  | { ok: true; order: TrackedOrder; live: { token: string; channel: string } | null }
  | { ok: false; error: "invalid" | "notFound" | "rateLimited" | "unavailable" };

export async function trackOrder(_prev: TrackOrderState, formData: FormData): Promise<TrackOrderState> {
  const rawNumber = String(formData.get("orderNumber") ?? "").trim().slice(0, 40);
  const contact = String(formData.get("contact") ?? "").trim().slice(0, 120);
  if (rawNumber.length < 4 || !contact) return { ok: false, error: "invalid" };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!(await rateLimit(`track:${ip}`, 12, 10 * 60_000))) return { ok: false, error: "rateLimited" };

  try {
    const order = await findOrderForTracking({ orderNumber: normalizeOrderNumber(rawNumber) });
    const address = (order?.shippingAddress ?? {}) as { phone?: string };
    // Même réponse pour « inconnue » et « mauvais contact » : on ne confirme
    // jamais l'existence d'un numéro à quelqu'un qui ne peut pas le prouver.
    if (!order || !contactMatches(contact, { customerEmail: order.customerEmail, phone: address.phone ?? null })) {
      return { ok: false, error: "notFound" };
    }

    const token = makeTrackingToken(order.id);
    const channel = trackingChannel(order.id);
    return { ok: true, order: toTrackedOrder(order), live: token && channel ? { token, channel } : null };
  } catch (error) {
    console.error("[suivi] trackOrder:", error);
    return { ok: false, error: "unavailable" };
  }
}
