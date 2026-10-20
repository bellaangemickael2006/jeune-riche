"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
import { contactMatches, normalizeOrderNumber, trackingStepIndex } from "@/lib/orders/tracking";

export type TrackedOrder = {
  orderNumber: string;
  step: number | null; // null = annulée
  createdAt: string;
  updatedAt: string;
  trackingNumber: string | null;
  total: number;
  items: { name: string; size: string; color: string; quantity: number }[];
};

export type TrackOrderState =
  | null
  | { ok: true; order: TrackedOrder }
  | { ok: false; error: "invalid" | "notFound" | "rateLimited" | "unavailable" };

// Ne renvoie que l'avancement et le contenu : ni adresse, ni téléphone, ni
// email — même au bon destinataire, rien de personnel ne repart du serveur.
export async function trackOrder(_prev: TrackOrderState, formData: FormData): Promise<TrackOrderState> {
  const rawNumber = String(formData.get("orderNumber") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim().slice(0, 120);
  if (rawNumber.length < 4 || !contact) return { ok: false, error: "invalid" };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!(await rateLimit(`track:${ip}`, 12, 10 * 60_000))) return { ok: false, error: "rateLimited" };

  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber: normalizeOrderNumber(rawNumber) },
      include: { items: true },
    });
    const address = (order?.shippingAddress ?? {}) as { phone?: string };
    // Même réponse pour « inconnue » et « mauvais contact » : on ne confirme
    // jamais l'existence d'un numéro à quelqu'un qui ne peut pas le prouver.
    if (!order || !contactMatches(contact, { customerEmail: order.customerEmail, phone: address.phone ?? null })) {
      return { ok: false, error: "notFound" };
    }

    return {
      ok: true,
      order: {
        orderNumber: order.orderNumber,
        step: trackingStepIndex(order.status),
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        trackingNumber: order.status === "EXPEDIEE" || order.status === "LIVREE" ? order.trackingNumber : null,
        total: Number(order.total),
        items: order.items.map((i) => ({ name: i.productName, size: i.size, color: i.color, quantity: i.quantity })),
      },
    };
  } catch (error) {
    console.error("[suivi] trackOrder:", error);
    return { ok: false, error: "unavailable" };
  }
}
