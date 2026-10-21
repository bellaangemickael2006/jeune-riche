import { after, NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { whatsappOrderLink } from "@/lib/utils";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { createOrder, afterOrderCreated, notifyNewOrder, CheckoutError } from "@/lib/orders/createOrder";
import { MAX_CART_LINES, MAX_LINE_QUANTITY } from "@/lib/orders/limits";
import {
  claimIdempotencyKey,
  completeIdempotencyKey,
  isIdempotencyKey,
  releaseIdempotencyKey,
} from "@/lib/orders/idempotency";

// Longueurs maximales : sans elles, un appel direct pouvait enregistrer des
// mégaoctets de texte par commande (et les recopier dans l'email admin).
const lineSchema = z.object({
  variantId: z.string().min(1).max(64),
  quantity: z.number().int().positive().max(MAX_LINE_QUANTITY),
  // Contrôlée et coupée ensuite selon le produit (lib/orders/personalization.ts).
  personalization: z.string().max(100).nullable(),
});

const schema = z.object({
  customerName: z.string().trim().min(1).max(100),
  // WhatsApp (numéro obligatoire ci-dessous) est le canal de contact
  // principal désormais — l'email reste utile pour l'historique du compte
  // mais ne doit jamais bloquer la commande s'il est laissé vide.
  customerEmail: z.union([z.literal(""), z.string().trim().email().max(254)]),
  shippingAddress: z.object({
    line1: z.string().trim().min(1).max(200),
    city: z.string().trim().min(1).max(100),
    postalCode: z.string().trim().max(20).optional(),
    country: z.string().trim().min(1).max(60),
    phone: z.string().trim().min(1, "Le numéro de téléphone est requis.").max(30),
  }),
  lines: z.array(lineSchema).min(1).max(MAX_CART_LINES),
  promoCode: z.string().trim().max(40).optional(),
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
  if (!(await rateLimit(`checkout:${clientIp(req)}`, 20, 10 * 60_000))) {
    return NextResponse.json({ error: "Trop de tentatives, réessayez dans quelques minutes." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide.", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { customerName, customerEmail, shippingAddress } = parsed.data;

  // Nouvel essai d'une commande déjà passée (voir lib/orders/idempotency.ts) :
  // même réponse, aucune seconde commande.
  const idempotencyKey = req.headers.get("idempotency-key");
  const claim = isIdempotencyKey(idempotencyKey) ? await claimIdempotencyKey(idempotencyKey) : null;
  if (claim?.state === "done") return NextResponse.json(claim.response);
  if (claim?.state === "pending") {
    return NextResponse.json({ error: "Votre commande est déjà en cours d'envoi, patientez un instant." }, { status: 409 });
  }
  const tracked = claim?.state === "new" ? idempotencyKey : null;

  try {
    const { order, resolvedLines, discountCode, discountAmount } = await createOrder({
      ...parsed.data,
      userId: await currentUserId(),
    });

    // Attendu (comme avant l'extraction) pour que la lecture des réglages se
    // termine avant la réponse : sur Vercel, le travail après la réponse peut
    // être interrompu. Les envois d'email restent non bloquants.
    await afterOrderCreated({ customerEmail, resolvedLines });

    // Après la réponse au client : il n'attend pas l'envoi de l'email, et
    // Vercel garde la fonction en vie jusqu'à la fin de l'envoi.
    after(() =>
      notifyNewOrder({
        order,
        customerName,
        customerEmail,
        shippingAddress,
        resolvedLines,
        discount: discountCode ? { code: discountCode, amount: discountAmount } : null,
      })
    );

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

    const body = { ok: true, orderNumber: order.orderNumber, whatsappUrl };
    if (tracked) await completeIdempotencyKey(tracked, body);
    return NextResponse.json(body);
  } catch (error) {
    if (tracked) await releaseIdempotencyKey(tracked);
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[api/checkout]", error);
    return NextResponse.json({ error: "Impossible de créer la commande." }, { status: 500 });
  }
}
