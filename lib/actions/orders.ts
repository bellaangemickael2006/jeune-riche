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
import { accountChannel, trackingChannel } from "@/lib/orders/liveTracking";
import { sendOrderPush } from "@/lib/push/send";
import type { OrderPushEvent } from "@/lib/push/messages";

/**
 * Prévient en temps réel les pages du client ouvertes sur cette commande —
 * page Suivi et liste « Mes commandes » de son compte — qu'elle vient de
 * changer (voir lib/orders/liveTracking.ts) et, pour un changement qui
 * intéresse le client (pushEvent), envoie une notification à ses appareils
 * abonnés, même site fermé (voir lib/push/send.ts). Après la réponse :
 * l'admin n'attend jamais ces envois.
 */
function notifyTracking(order: { id: string; userId: string | null; orderNumber: string }, pushEvent?: OrderPushEvent) {
  const channels = [trackingChannel(order.id), order.userId ? accountChannel(order.userId) : null].filter((c): c is string =>
    Boolean(c)
  );
  after(() =>
    Promise.all([
      ...channels.map((channel) => broadcast(channel, "update")),
      pushEvent ? sendOrderPush({ orderId: order.id, userId: order.userId, orderNumber: order.orderNumber, event: pushEvent }) : null,
    ])
  );
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
    notifyTracking(order, { kind: "status", status });
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

    const previous = await prisma.order.findUnique({ where: { id: orderId }, select: { trackingNumber: true } });
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
    // Notification seulement pour un nouveau numéro de suivi (les notes restent internes).
    const newTracking = trackingNumber && trackingNumber !== previous?.trackingNumber ? trackingNumber : null;
    notifyTracking(order, newTracking ? { kind: "tracking", trackingNumber: newTracking } : undefined);
    revalidatePath(`/admin/commandes/${orderId}`);
    return "Enregistré.";
  });
}
