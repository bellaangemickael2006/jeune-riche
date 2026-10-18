import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rateLimit";

// Le navigateur n'envoie que des identifiants et des quantités : nom, taille,
// couleur et prix sont relus en base. Sans ça, un appel direct à cette route
// pouvait injecter du texte arbitraire dans l'email de relance envoyé au
// client, et fixer un total de son choix.
const lineSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().positive().max(99),
  personalization: z.string().max(200).nullable().optional(),
});

const schema = z.object({
  email: z.string().email().max(254),
  items: z.array(lineSchema).min(1).max(50),
});

// Appelé en tâche de fond dès que le client passe l'étape "informations" du
// checkout (email connu) — sans bloquer sa progression si cet appel échoue.
// Une commande passée avec succès annule ce snapshot (voir /api/checkout).
export async function POST(req: NextRequest) {
  if (!rateLimit(`cart-snapshot:${clientIp(req)}`, 30, 10 * 60_000)) {
    return NextResponse.json({ ok: true });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const { email, items } = parsed.data;

  try {
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: items.map((i) => i.variantId) } },
      include: { product: true },
    });
    const byId = new Map(variants.map((v) => [v.id, v]));

    const resolved = [];
    for (const item of items) {
      const variant = byId.get(item.variantId);
      // Article inconnu, non publié ou sans prix : on n'enregistre pas le
      // panier plutôt que d'en garder une version incohérente.
      if (!variant || !variant.product.published || variant.product.price === null) {
        return NextResponse.json({ ok: true });
      }
      resolved.push({
        productName: variant.product.name,
        size: variant.size,
        color: variant.color,
        quantity: item.quantity,
        unitPrice: Number(variant.product.price),
        personalization: item.personalization ?? null,
      });
    }

    const total = resolved.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

    await prisma.abandonedCart.upsert({
      where: { email },
      create: { email, items: resolved, total },
      update: {
        items: resolved,
        total,
        // Nouveau panier abandonné pour cet email : on réarme la relance et
        // on efface un éventuel "converti" d'une commande précédente.
        remindedAt: null,
        convertedAt: null,
      },
    });
  } catch (error) {
    console.error("[api/cart/snapshot]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
