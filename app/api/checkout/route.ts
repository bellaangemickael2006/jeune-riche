import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { whatsappOrderLink } from "@/lib/utils";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { createOrder, afterOrderCreated, CheckoutError } from "@/lib/orders/createOrder";

const lineSchema = z.object({
  variantId: z.string(),
  quantity: z.number().int().positive(),
  personalization: z.string().nullable(),
});

const schema = z.object({
  customerName: z.string().min(1),
  // WhatsApp (numéro obligatoire ci-dessous) est le canal de contact
  // principal désormais — l'email reste utile pour l'historique du compte
  // mais ne doit jamais bloquer la commande s'il est laissé vide.
  customerEmail: z.union([z.literal(""), z.string().email()]),
  shippingAddress: z.object({
    line1: z.string().min(1),
    city: z.string().min(1),
    postalCode: z.string().optional(),
    country: z.string().min(1),
    phone: z.string().min(1, "Le numéro de téléphone est requis."),
  }),
  lines: z.array(lineSchema).min(1),
  promoCode: z.string().optional(),
});

// Résolu côté serveur depuis le cookie de session — jamais depuis un champ
// envoyé par le client — pour rattacher la commande au compte connecté
// (historique dans /compte) et mettre à jour son adresse enregistrée.
async function currentUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) return null;
    const dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
    return dbUser?.id ?? null;
  } catch {
    // pas de session ou Supabase indisponible : commande traitée comme invité
    return null;
  }
}

export async function POST(req: NextRequest) {
  // Généreux exprès : ne doit jamais gêner un client qui retente après une
  // erreur réseau, seulement freiner un script qui viderait le stock en
  // boucle.
  if (!rateLimit(`checkout:${clientIp(req)}`, 20, 10 * 60_000)) {
    return NextResponse.json({ error: "Trop de tentatives, réessayez dans quelques minutes." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide.", details: parsed.error.flatten() }, { status: 400 });
  }

  const { customerName, customerEmail, shippingAddress } = parsed.data;

  try {
    const { order, resolvedLines, discountCode, discountAmount } = await createOrder({
      ...parsed.data,
      userId: await currentUserId(),
    });

    // Attendu (comme avant l'extraction) pour que la lecture des réglages se
    // termine avant la réponse : sur Vercel, le travail après la réponse peut
    // être interrompu. Les envois d'email restent non bloquants.
    await afterOrderCreated({ customerEmail, resolvedLines });

    // WhatsApp (numéro renseigné, obligatoire) est le canal de contact
    // principal — construit côté serveur à partir des lignes résolues en
    // base (jamais depuis ce qu'a envoyé le navigateur), pour que le message
    // pré-rempli reflète exactement ce qui a été enregistré.
    const whatsappUrl = whatsappOrderLink({
      orderNumber: order.orderNumber,
      customerName,
      phone: shippingAddress.phone,
      address: shippingAddress,
      items: resolvedLines,
      total: Number(order.total),
      discount: discountCode ? { code: discountCode, amount: discountAmount } : null,
    });

    return NextResponse.json({ ok: true, orderNumber: order.orderNumber, whatsappUrl });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[api/checkout]", error);
    return NextResponse.json({ error: "Impossible de créer la commande." }, { status: 500 });
  }
}
