import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const lineSchema = z.object({
  productName: z.string(),
  size: z.string(),
  color: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number(),
  personalization: z.string().nullable().optional(),
});

const schema = z.object({
  email: z.string().email(),
  items: z.array(lineSchema).min(1),
  total: z.number().nonnegative(),
});

// Appelé en tâche de fond dès que le client passe l'étape "informations" du
// checkout (email connu) — sans bloquer sa progression si cet appel échoue.
// Une commande passée avec succès annule ce snapshot (voir /api/checkout).
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  try {
    await prisma.abandonedCart.upsert({
      where: { email: parsed.data.email },
      create: {
        email: parsed.data.email,
        items: parsed.data.items,
        total: parsed.data.total,
      },
      update: {
        items: parsed.data.items,
        total: parsed.data.total,
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
