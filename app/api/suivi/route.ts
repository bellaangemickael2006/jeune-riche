import { NextRequest, NextResponse } from "next/server";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { readTrackingToken } from "@/lib/orders/liveTracking";
import { findOrderForTracking, toTrackedOrder } from "@/lib/orders/trackedOrder";

// État à jour d'une commande déjà vérifiée sur /suivi (jeton signé remis
// après la vérification, voir lib/orders/liveTracking.ts). Relu à chaque
// signal « mise à jour » de l'admin, et de temps en temps en secours.
export async function GET(req: NextRequest) {
  // Large : une page ouverte relit au plus une fois par minute, plus les signaux.
  if (!(await rateLimit(`suivi-live:${clientIp(req)}`, 60, 10 * 60_000))) {
    return NextResponse.json({ error: "rateLimited" }, { status: 429 });
  }
  const orderId = readTrackingToken(req.nextUrl.searchParams.get("t"));
  if (!orderId) return NextResponse.json({ error: "expired" }, { status: 401 });

  try {
    const order = await findOrderForTracking({ id: orderId });
    if (!order) return NextResponse.json({ error: "notFound" }, { status: 404 });
    return NextResponse.json({ order: toTrackedOrder(order) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[api/suivi]", error);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
