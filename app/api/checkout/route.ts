import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStoreSettings } from "@/lib/data/settings";
import { createClient } from "@/lib/supabase/server";
import { whatsappOrderLink, LOW_STOCK_THRESHOLD } from "@/lib/utils";
import { sendEmail, lowStockAlertEmail } from "@/lib/email";
import { resolvePromoCode } from "@/lib/data/promoCodes";
import { rateLimit, clientIp } from "@/lib/rateLimit";

// Le stock est revérifié à l'écriture, pas seulement à la lecture plus haut :
// entre la vérification initiale et la transaction, une autre commande
// concurrente a pu épuiser le stock (deux clients sur le dernier exemplaire
// d'un drop limité, par exemple) — sans ce garde-fou, decrement() peut passer
// le stock en négatif.
class InsufficientStockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InsufficientStockError";
  }
}

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

export async function POST(req: NextRequest) {
  // Généreux exprès : ne doit jamais gêner un client qui retente après une
  // erreur réseau, seulement freiner un script qui viderait le stock en
  // boucle.
  if (!rateLimit(`checkout:${clientIp(req)}`, 20, 10 * 60_000)) {
    return NextResponse.json({ error: "Trop de tentatives, réessayez dans quelques minutes." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide.", details: parsed.error.flatten() }, { status: 400 });
  }

  const { customerName, customerEmail, shippingAddress, lines, promoCode } = parsed.data;
  const orderNumber = `JR-${Date.now().toString(36).toUpperCase()}`;

  // Résolu côté serveur depuis le cookie de session — jamais depuis un champ
  // envoyé par le client — pour rattacher la commande au compte connecté
  // (historique dans /compte) et mettre à jour son adresse enregistrée.
  let loggedInUserId: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (authUser) {
      const dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
      if (dbUser) loggedInUserId = dbUser.id;
    }
  } catch {
    // pas de session ou Supabase indisponible : commande traitée comme invité
  }

  try {
    // Le prix envoyé par le navigateur n'est jamais fiable : on ne fait
    // confiance qu'à variantId + quantity, et on relit prix/stock/nom en base.
    const resolvedLines: {
      variantId: string;
      productName: string;
      size: string;
      color: string;
      quantity: number;
      unitPrice: number;
      personalization: string | null;
      stockBefore: number;
    }[] = [];
    for (const line of lines) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: line.variantId },
        include: { product: true },
      });

      if (!variant || !variant.product.published || variant.product.price === null) {
        return NextResponse.json(
          { error: "Un des articles du panier n'est plus disponible à la commande." },
          { status: 409 }
        );
      }
      if (variant.stock < line.quantity) {
        return NextResponse.json(
          { error: `Stock insuffisant pour ${variant.product.name} (${variant.size}/${variant.color}).` },
          { status: 409 }
        );
      }

      resolvedLines.push({
        variantId: variant.id,
        productName: variant.product.name,
        size: variant.size,
        color: variant.color,
        quantity: line.quantity,
        unitPrice: Number(variant.product.price),
        personalization: line.personalization,
        stockBefore: variant.stock,
      });
    }

    const subtotal = resolvedLines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

    // Toujours calculés côté serveur depuis les réglages admin — jamais
    // acceptés depuis le client, même logique de confiance que le prix.
    const settings = await getStoreSettings();
    const freeThreshold =
      settings?.freeShippingThreshold !== null && settings?.freeShippingThreshold !== undefined
        ? Number(settings.freeShippingThreshold)
        : null;
    // Calculé sur le sous-total AVANT remise : le seuil de livraison offerte
    // porte sur la taille réelle du panier, pas sur ce qu'il reste à payer.
    const shippingCost =
      freeThreshold !== null && subtotal >= freeThreshold ? 0 : Number(settings?.shippingCost ?? 0);

    // Revalidé ici, jamais confiance au montant affiché côté client. Une
    // erreur promo (invalide, expiré, ou épuisé par une commande concurrente
    // entre-temps) ne bloque jamais la vente : la remise est simplement
    // ignorée plutôt que de faire échouer tout le checkout pour un problème
    // de marketing — contrairement au stock, où une rupture doit bloquer.
    let discountAmount = 0;
    let discountCode: string | null = null;
    let appliedPromoId: string | null = null;
    if (promoCode) {
      const promoResult = await resolvePromoCode(promoCode, subtotal);
      if (promoResult.valid) {
        discountAmount = promoResult.discountAmount;
        discountCode = promoResult.code;
        appliedPromoId = promoResult.promoCodeId;
      }
    }

    const order = await prisma.$transaction(async (tx) => {
      if (appliedPromoId) {
        // Comparer-échanger sur usedCount (relu ici, pas la valeur mise en
        // cache plus haut) : si une commande concurrente vient de prendre la
        // dernière place disponible, on le détecte et on abandonne juste la
        // remise pour CETTE commande plutôt que de la faire échouer.
        const promo = await tx.promoCode.findUnique({ where: { id: appliedPromoId } });
        const stillValid =
          promo && promo.active && (promo.maxUses === null || promo.usedCount < promo.maxUses);
        if (stillValid) {
          const promoUpdate = await tx.promoCode.updateMany({
            where: { id: appliedPromoId, usedCount: promo.usedCount },
            data: { usedCount: { increment: 1 } },
          });
          if (promoUpdate.count === 0) {
            discountAmount = 0;
            discountCode = null;
          }
        } else {
          discountAmount = 0;
          discountCode = null;
        }
      }

      const total = subtotal - discountAmount + shippingCost;

      const created = await tx.order.create({
        data: {
          orderNumber,
          customerName,
          customerEmail,
          // Order n'a pas encore de colonnes discountCode/discountAmount —
          // ce champ a été retiré du schéma tant que la migration Prisma
          // n'est pas appliquée à la vraie base (voir commit history). La
          // remise reste appliquée à `total` et visible dans le message
          // WhatsApp ci-dessous ; à réintégrer proprement dans Order une
          // fois la migration passée.
          shippingAddress,
          subtotal,
          shippingCost,
          total,
          userId: loggedInUserId,
          // `stockBefore` sert uniquement à l'alerte stock bas plus bas dans
          // cette fonction — ce n'est pas un champ d'OrderItem. TypeScript ne
          // signale pas les propriétés en trop sur une variable (seulement
          // sur un littéral), donc le laisser dans `resolvedLines` ici fait
          // échouer la requête Prisma à l'exécution ("Unknown argument").
          items: {
            create: resolvedLines.map((l) => ({
              variantId: l.variantId,
              productName: l.productName,
              size: l.size,
              color: l.color,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              personalization: l.personalization,
            })),
          },
        },
      });

      if (loggedInUserId) {
        await tx.user.update({
          where: { id: loggedInUserId },
          data: {
            addressLine1: shippingAddress.line1,
            addressCity: shippingAddress.city,
            addressPostalCode: shippingAddress.postalCode || null,
            addressCountry: shippingAddress.country,
            addressPhone: shippingAddress.phone || null,
          },
        });
      }

      for (const line of resolvedLines) {
        const result = await tx.productVariant.updateMany({
          where: { id: line.variantId, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });
        if (result.count === 0) {
          throw new InsufficientStockError(
            `Stock insuffisant pour ${line.productName} (${line.size}/${line.color}).`
          );
        }
      }

      return created;
    });

    // Alerte l'admin uniquement au moment où une variante FRANCHIT le seuil
    // (stock avant > seuil >= stock après) — jamais à chaque vente tant
    // qu'elle reste déjà basse, pour ne pas spammer. Best-effort : ne doit
    // jamais faire échouer la commande.
    if (settings?.contactEmail) {
      for (const line of resolvedLines) {
        const stockAfter = line.stockBefore - line.quantity;
        if (line.stockBefore > LOW_STOCK_THRESHOLD && stockAfter <= LOW_STOCK_THRESHOLD) {
          sendEmail({
            to: settings.contactEmail,
            subject: `Stock critique — ${line.productName} (${line.color}/${line.size})`,
            html: lowStockAlertEmail({
              productName: line.productName,
              color: line.color,
              size: line.size,
              remaining: Math.max(stockAfter, 0),
            }),
          }).catch((error) => console.error("[api/checkout] low stock alert:", error));
        }
      }
    }

    // Empêche la relance panier abandonné de cibler une commande déjà
    // passée — ne doit jamais faire échouer la commande si ça rate. No-op
    // silencieux si customerEmail est vide (rien à retrouver, pas grave).
    if (customerEmail) {
      prisma.abandonedCart
        .updateMany({ where: { email: customerEmail, convertedAt: null }, data: { convertedAt: new Date() } })
        .catch((error) => console.error("[api/checkout] abandonedCart.updateMany:", error));
    }

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
    if (error instanceof InsufficientStockError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("[api/checkout]", error);
    return NextResponse.json({ error: "Impossible de créer la commande." }, { status: 500 });
  }
}
