import "server-only";
import { prisma } from "@/lib/prisma";
import { getStoreSettings } from "@/lib/data/settings";
import { resolvePromoCode } from "@/lib/data/promoCodes";
import { LOW_STOCK_THRESHOLD, whatsappStatusUpdateLink } from "@/lib/utils";
import { sendEmail, lowStockAlertEmail, newOrderAdminEmail } from "@/lib/email";
import { subtotalOf, totalOf } from "@/lib/orders/pricing";

/**
 * Erreur métier à renvoyer telle quelle au client (article indisponible,
 * rupture de stock). Toute autre erreur est un incident serveur.
 */
export class CheckoutError extends Error {
  constructor(
    message: string,
    readonly status = 409
  ) {
    super(message);
    this.name = "CheckoutError";
  }
}

export type CheckoutLineInput = {
  variantId: string;
  quantity: number;
  personalization: string | null;
};

export type ShippingAddress = {
  line1: string;
  city: string;
  postalCode?: string;
  country: string;
  phone: string;
};

export type CreateOrderInput = {
  customerName: string;
  customerEmail: string;
  shippingAddress: ShippingAddress;
  lines: CheckoutLineInput[];
  promoCode?: string;
  // Résolu côté serveur depuis la session, jamais depuis un champ du client.
  userId: string | null;
};

export type ResolvedLine = {
  variantId: string;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  personalization: string | null;
  stockBefore: number;
};

// Le prix envoyé par le navigateur n'est jamais fiable : on ne fait confiance
// qu'à variantId + quantity, et on relit prix/stock/nom en base.
async function resolveLines(lines: CheckoutLineInput[]): Promise<ResolvedLine[]> {
  const resolved: ResolvedLine[] = [];
  for (const line of lines) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: line.variantId },
      include: { product: true },
    });

    if (!variant || !variant.product.published || variant.product.price === null) {
      throw new CheckoutError("Un des articles du panier n'est plus disponible à la commande.");
    }
    if (variant.stock < line.quantity) {
      throw new CheckoutError(`Stock insuffisant pour ${variant.product.name} (${variant.size}/${variant.color}).`);
    }

    resolved.push({
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
  return resolved;
}

export async function createOrder(input: CreateOrderInput) {
  const { customerName, customerEmail, shippingAddress, lines, promoCode, userId } = input;
  const orderNumber = `JR-${Date.now().toString(36).toUpperCase()}`;

  const resolvedLines = await resolveLines(lines);
  const subtotal = subtotalOf(resolvedLines);

  // Pas de frais de livraison fixes : ça varie trop selon la destination
  // pour un montant unique facturé en ligne — communiqués au client par
  // message après la commande, jamais ajoutés à `total`. Le seuil de
  // livraison offerte (réglable en admin) n'est qu'un argument affiché au
  // client côté /checkout (voir /api/shipping).
  const shippingCost = 0;

  // Revalidé ici, jamais confiance au montant affiché côté client. Une
  // erreur promo (invalide, expiré, ou épuisé par une commande concurrente
  // entre-temps) ne bloque jamais la vente : la remise est simplement
  // ignorée — contrairement au stock, où une rupture doit bloquer.
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
      // dernière place disponible, on abandonne juste la remise pour CETTE
      // commande plutôt que de la faire échouer.
      const promo = await tx.promoCode.findUnique({ where: { id: appliedPromoId } });
      const stillValid = promo && promo.active && (promo.maxUses === null || promo.usedCount < promo.maxUses);
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

    const created = await tx.order.create({
      data: {
        orderNumber,
        customerName,
        customerEmail,
        shippingAddress,
        subtotal,
        shippingCost,
        discountCode,
        discountAmount,
        total: totalOf(subtotal, discountAmount, shippingCost),
        userId,
        // `stockBefore` n'est pas un champ d'OrderItem : TypeScript ne signale
        // pas les propriétés en trop sur une variable, et Prisma rejetterait
        // la requête à l'exécution ("Unknown argument").
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

    if (userId) {
      await tx.user.update({
        where: { id: userId },
        data: {
          addressLine1: shippingAddress.line1,
          addressCity: shippingAddress.city,
          addressPostalCode: shippingAddress.postalCode || null,
          addressCountry: shippingAddress.country,
          addressPhone: shippingAddress.phone || null,
        },
      });
    }

    // Le stock est revérifié à l'écriture : entre la lecture plus haut et
    // cette transaction, une commande concurrente a pu épuiser le stock.
    // Sans le garde-fou `gte`, decrement() pourrait passer le stock en négatif.
    for (const line of resolvedLines) {
      const result = await tx.productVariant.updateMany({
        where: { id: line.variantId, stock: { gte: line.quantity } },
        data: { stock: { decrement: line.quantity } },
      });
      if (result.count === 0) {
        throw new CheckoutError(`Stock insuffisant pour ${line.productName} (${line.size}/${line.color}).`);
      }
    }

    return created;
  });

  return { order, resolvedLines, discountCode, discountAmount };
}

/**
 * Prévient la boutique de la nouvelle commande par email : à l'email de
 * contact des Paramètres, sinon à tous les administrateurs. Ne lève jamais
 * d'erreur (la commande est déjà enregistrée).
 */
export async function notifyNewOrder(params: {
  order: { id: string; orderNumber: string; total: unknown };
  customerName: string;
  customerEmail: string;
  shippingAddress: ShippingAddress;
  resolvedLines: ResolvedLine[];
  discount: { code: string; amount: number } | null;
}) {
  try {
    const settings = await getStoreSettings().catch(() => null);
    const recipients = settings?.contactEmail
      ? [settings.contactEmail]
      : (await prisma.user.findMany({ where: { role: "ADMIN" }, select: { email: true } })).map((u) => u.email);
    if (recipients.length === 0) return;

    const { order, shippingAddress } = params;
    const result = await sendEmail({
      to: recipients.join(","),
      subject: `Nouvelle commande ${order.orderNumber} — ${params.customerName}`,
      html: newOrderAdminEmail({
        orderNumber: order.orderNumber,
        orderId: order.id,
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        phone: shippingAddress.phone,
        address: shippingAddress,
        items: params.resolvedLines,
        discount: params.discount,
        total: Number(order.total),
        whatsappUrl: whatsappStatusUpdateLink("CONFIRMEE", order.orderNumber, shippingAddress.phone),
      }),
    });
    if (!result.sent) console.error("[orders] notification nouvelle commande non envoyée:", order.orderNumber);
  } catch (error) {
    console.error("[orders] notifyNewOrder:", error);
  }
}

/**
 * Effets secondaires après une commande réussie. Best-effort : aucun ne doit
 * faire échouer la commande, et aucun n'est attendu par le client.
 */
export async function afterOrderCreated(params: { customerEmail: string; resolvedLines: ResolvedLine[] }) {
  const { customerEmail, resolvedLines } = params;

  // Alerte l'admin uniquement au moment où une variante FRANCHIT le seuil
  // (stock avant > seuil >= stock après) — pas à chaque vente tant qu'elle
  // reste déjà basse, pour ne pas spammer.
  try {
    const settings = await getStoreSettings();
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
          }).catch((error) => console.error("[orders] low stock alert:", error));
        }
      }
    }
  } catch (error) {
    console.error("[orders] getStoreSettings:", error);
  }

  // Empêche la relance panier abandonné de cibler une commande déjà passée.
  // No-op si customerEmail est vide (rien à retrouver).
  if (customerEmail) {
    prisma.abandonedCart
      .updateMany({ where: { email: customerEmail, convertedAt: null }, data: { convertedAt: new Date() } })
      .catch((error) => console.error("[orders] abandonedCart.updateMany:", error));
  }
}
