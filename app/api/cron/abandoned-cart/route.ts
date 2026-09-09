import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, abandonedCartEmail } from "@/lib/email";

// Déclenché une fois par jour par Vercel Cron (voir vercel.json — le plan
// gratuit "Hobby" n'autorise pas plus d'une exécution/jour, toute fréquence
// supérieure fait échouer le déploiement entier). Vercel ajoute
// automatiquement `Authorization: Bearer $CRON_SECRET` sur ses propres
// appels — ce contrôle empêche n'importe qui d'appeler cette route pour
// spammer les paniers abandonnés à volonté.
function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

type CartLineSnapshot = { productName: string; size: string; color: string; quantity: number };

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const now = Date.now();
  // Assez de temps pour que le client finisse tranquillement (pas de relance
  // à 1h du matin pour un panier vieux de 20 min), mais pas trop vieux pour
  // rester pertinent — au-delà, le produit ou son stock a pu changer.
  const from = new Date(now - 48 * 3600_000);
  const until = new Date(now - 3600_000);

  const candidates = await prisma.abandonedCart.findMany({
    where: {
      remindedAt: null,
      convertedAt: null,
      createdAt: { gte: from, lte: until },
    },
  });

  let sent = 0;
  for (const cart of candidates) {
    const items = cart.items as unknown as CartLineSnapshot[];
    const result = await sendEmail({
      to: cart.email,
      subject: "Votre sélection JEUNE RICHE vous attend",
      html: abandonedCartEmail({ items, total: Number(cart.total) }),
    });
    if (result.sent) sent++;
    // Marqué même en cas d'échec d'envoi : on ne veut pas retenter en boucle
    // sur une adresse qui rejette systématiquement (évite tout risque de
    // spam involontaire vers un email invalide).
    await prisma.abandonedCart.update({ where: { id: cart.id }, data: { remindedAt: new Date() } });
  }

  return NextResponse.json({ ok: true, candidates: candidates.length, sent });
}
