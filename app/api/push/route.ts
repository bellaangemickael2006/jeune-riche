import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { readTrackingToken } from "@/lib/orders/liveTracking";
import { isPushEndpoint, MAX_SUBSCRIPTIONS_PER_SCOPE, orderScope, userScope } from "@/lib/push/messages";
import { vapidKeys } from "@/lib/push/send";

// Abonnement d'un appareil aux notifications d'une commande (page Suivi,
// prouvée par le jeton signé remis après vérification) ou du compte du
// client connecté. Voir lib/push/send.ts pour l'envoi.

const target = z.union([
  z.object({ type: z.literal("order"), token: z.string().min(1).max(300) }),
  z.object({ type: z.literal("account") }),
]);

const subscribeSchema = z.object({
  target,
  locale: z.string().max(10).optional(),
  subscription: z.object({
    endpoint: z.string().max(1000).refine(isPushEndpoint),
    keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }),
  }),
});

const unsubscribeSchema = z.object({ target, endpoint: z.string().max(1000) });

/** Portée prouvée par la requête, ou null (jeton expiré, client non connecté…). */
async function resolveScope(t: z.infer<typeof target>): Promise<string | null> {
  if (t.type === "order") {
    const orderId = readTrackingToken(t.token);
    return orderId ? orderScope(orderId) : null;
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { id: true } });
  return dbUser ? userScope(dbUser.id) : null;
}

/** Notifications opérationnelles ? Le bouton reste caché tant que la clé privée n'est pas réglée. */
export async function GET() {
  return NextResponse.json({ enabled: Boolean(vapidKeys()) }, { headers: { "Cache-Control": "public, max-age=300" } });
}

async function guard(req: NextRequest) {
  return rateLimit(`push:${clientIp(req)}`, 20, 10 * 60_000);
}

export async function POST(req: NextRequest) {
  if (!(await guard(req))) return NextResponse.json({ error: "rateLimited" }, { status: 429 });
  // Sans clé privée sur Vercel, rien ne pourrait être envoyé : on ne promet rien.
  if (!vapidKeys()) return NextResponse.json({ error: "notConfigured" }, { status: 503 });
  const parsed = subscribeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { subscription, locale } = parsed.data;

  try {
    const scope = await resolveScope(parsed.data.target);
    if (!scope) return NextResponse.json({ error: "expired" }, { status: 401 });

    const data = {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      locale: locale ?? "fr",
    };
    await prisma.pushSubscription.upsert({
      where: { endpoint_scope: { endpoint: subscription.endpoint, scope } },
      create: { endpoint: subscription.endpoint, scope, ...data },
      update: data,
    });

    // Plafond par portée : on garde les plus récents.
    const extra = await prisma.pushSubscription.findMany({
      where: { scope },
      orderBy: { createdAt: "desc" },
      skip: MAX_SUBSCRIPTIONS_PER_SCOPE,
      select: { id: true },
    });
    if (extra.length) await prisma.pushSubscription.deleteMany({ where: { id: { in: extra.map((e) => e.id) } } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/push]", error);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await guard(req))) return NextResponse.json({ error: "rateLimited" }, { status: 429 });
  const parsed = unsubscribeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  try {
    const scope = await resolveScope(parsed.data.target);
    if (scope) await prisma.pushSubscription.deleteMany({ where: { scope, endpoint: parsed.data.endpoint } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/push]", error);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
