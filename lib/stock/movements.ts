import "server-only";
import { prisma } from "@/lib/prisma";
import { sendEmail, restockEmail } from "@/lib/email";
import type { MovementReason } from "@/lib/stock/labels";

export type MovementInput = {
  variantId: string;
  productId: string;
  delta: number;
  stockAfter: number;
  reason: MovementReason;
  note?: string | null;
  orderId?: string | null;
  actorEmail?: string | null;
};

/**
 * Enregistre des mouvements dans l'historique. Toujours APRÈS l'opération et
 * sans jamais lever d'erreur : le stock réel a déjà changé, un historique
 * indisponible (table pas encore migrée) ne doit rien bloquer.
 */
export async function recordMovements(entries: MovementInput[]) {
  const data = entries.filter((e) => e.delta !== 0);
  if (data.length === 0) return;
  try {
    await prisma.stockMovement.createMany({ data });
  } catch (error) {
    console.error("[stock] historique non enregistré:", error);
  }
}

export async function getMovements(params: { productId?: string; take?: number }) {
  try {
    return await prisma.stockMovement.findMany({
      where: params.productId ? { productId: params.productId } : {},
      include: { variant: { select: { color: true, size: true, product: { select: { name: true, id: true } } } } },
      orderBy: { createdAt: "desc" },
      take: params.take ?? 50,
    });
  } catch (error) {
    console.error("[stock] lecture historique:", error);
    return null; // null = historique indisponible (migration à appliquer)
  }
}

/**
 * « Nous vous préviendrons dès le retour en stock » : prévient les clients
 * inscrits sur ces variantes, revenues au-dessus de zéro. Seules les alertes
 * réellement envoyées sont marquées : un échec d'envoi sera retenté au
 * prochain réassort au lieu d'être perdu.
 */
export async function notifyRestock(variantIds: string[]) {
  if (variantIds.length === 0) return 0;
  const pending = await prisma.restockRequest.findMany({
    where: { variantId: { in: variantIds }, notified: false },
    include: { variant: { include: { product: true } } },
  });
  const sent: string[] = [];
  for (const request of pending) {
    const result = await sendEmail({
      to: request.email,
      subject: `De retour en stock — JEUNE RICHE`,
      html: restockEmail({
        productName: request.variant.product.name,
        size: request.variant.size,
        color: request.variant.color,
        productSlug: request.variant.product.slug,
      }),
    });
    if (result.sent) sent.push(request.id);
  }
  if (sent.length > 0) {
    await prisma.restockRequest.updateMany({ where: { id: { in: sent } }, data: { notified: true } });
  }
  return sent.length;
}
