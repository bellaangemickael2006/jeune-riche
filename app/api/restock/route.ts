import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rateLimit";

const schema = z.object({
  variantId: z.string().min(1),
  email: z.string().trim().toLowerCase().email().max(254),
});

export async function POST(req: NextRequest) {
  if (!(await rateLimit(`restock:${clientIp(req)}`, 15, 15 * 60_000))) {
    return NextResponse.json({ error: "Trop de tentatives, réessayez plus tard." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const { variantId, email } = parsed.data;

  try {
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId }, select: { id: true } });
    if (!variant) return NextResponse.json({ error: "Article introuvable." }, { status: 404 });

    // Un même client qui clique deux fois ne doit pas recevoir deux emails
    // au retour en stock.
    const existing = await prisma.restockRequest.findFirst({ where: { variantId, email, notified: false } });
    if (!existing) await prisma.restockRequest.create({ data: { variantId, email } });
  } catch (error) {
    console.error("[api/restock]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
