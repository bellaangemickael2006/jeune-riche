"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminAction } from "@/lib/auth";
import { logAdmin } from "@/lib/admin/audit";
import { ActionError, runAction, type ActionResult } from "@/lib/actions/result";
import type { OrderStatus } from "@/lib/generated/prisma/client";
import { recordMovements } from "@/lib/stock/movements";
import { after } from "next/server";
import { broadcast } from "@/lib/realtime/broadcast";
import { trackingChannel } from "@/lib/orders/liveTracking";

/**
 * Prévient en temps réel la page Suivi du client, si elle est ouverte, que
 * sa commande vient de changer (voir lib/orders/liveTracking.ts). Après la
 * réponse : l'admin n'attend jamais ce signal.
 */
function notifyTracking(orderId: string) {
  const channel = trackingChannel(orderId);
  if (channel) after(() => broadcast(channel, "update"));
}

const STATUSES: OrderStatus[] = ["NOUVELLE", "CONFIRMEE", "PREPARATION", "EXPEDIEE", "LIVREE", "ANNULEE"];

export async function updateOrderStatus(orderId: string, formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const admin = await requireAdminAction("commandes");
    const status = String(formData.get("status") ?? "") as OrderStatus;
    if (!STATUSES.includes(status)) throw new ActionError("Statut inconnu.");

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new ActionError("Commande introuvable.");
    if (order.status === status) return "Statut inchangé.";

    // Annuler remet le stock en rayon ; revenir sur une annulation le reprend.
    // Avant, seule l'annulation était gérée : « dés-annuler » une commande
    // laissait le stock gonflé des articles déjà remis en rayon.
    const isCancelling = status === "ANNULEE";
    const isRestoring = order.status === "ANNULEE";

    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: orderId }, data: { status } });
      for (const item of order.items) {
        if (isCancelling) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        } else if (isRestoring) {
          const result = await tx.productVariant.updateMany({
            where: { id: item.variantId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (result.count === 0) {
            throw new ActionError(
              `Stock insuffisant pour réactiver la commande (${item.productName} ${item.color}/${item.size}).`
            );
          }
        }
      }
    });

    if (isCancelling || isRestoring) {
      const after = await prisma.productVariant.findMany({
        where: { id: { in: order.items.map((i) => i.variantId) } },
        select: { id: true, stock: true, productId: true },
      });
      const byId = new Map(after.map((v) => [v.id, v]));
      await recordMovements(
        order.items.flatMap((item) => {
          const v = byId.get(item.variantId);
          return v
            ? [
                {
                  variantId: v.id,
                  productId: v.productId,
                  delta: isCancelling ? item.quantity : -item.quantity,
                  stockAfter: v.stock,
                  reason: isCancelling ? ("annulation" as const) : ("reactivation" as const),
                  orderId,
                  note: order.orderNumber,
                  actorEmail: admin.email,
                },
              ]
            : [];
        })
      );
      revalidatePath("/admin/stock");
    }

    await logAdmin(admin, "commandes.statut", `${order.orderNumber} : ${order.status} → ${status}`, orderId);
    revalidatePath("/admin");
    revalidatePath("/admin/commandes");
    notifyTracking(orderId);
    revalidatePath(`/admin/commandes/${orderId}`);
    if (isCancelling) return "Commande annulée — stock remis en rayon.";
    if (isRestoring) return "Commande réactivée — stock repris.";
    return "Statut mis à jour.";
  });
}

export async function updateOrderFulfillment(orderId: string, formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const admin = await requireAdminAction("commandes");
    const trackingNumber = String(formData.get("trackingNumber") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        trackingNumber: trackingNumber || null,
        notes: notes || null,
      },
    });

    await logAdmin(
      admin,
      "commandes.suivi",
      `${order.orderNumber}${trackingNumber ? ` — n° de suivi ${trackingNumber}` : ""}${notes ? " — notes modifiées" : ""}`,
      orderId
    );
    notifyTracking(orderId);
    revalidatePath(`/admin/commandes/${orderId}`);
    return "Enregistré.";
  });
}
