"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ActionError, runAction, type ActionResult } from "@/lib/actions/result";
import type { OrderStatus } from "@prisma/client";

const STATUSES: OrderStatus[] = ["NOUVELLE", "CONFIRMEE", "PREPARATION", "EXPEDIEE", "LIVREE", "ANNULEE"];

export async function updateOrderStatus(orderId: string, formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdmin();
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

    revalidatePath("/admin");
    revalidatePath("/admin/commandes");
    revalidatePath(`/admin/commandes/${orderId}`);
    if (isCancelling) return "Commande annulée — stock remis en rayon.";
    if (isRestoring) return "Commande réactivée — stock repris.";
    return "Statut mis à jour.";
  });
}

export async function updateOrderFulfillment(orderId: string, formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdmin();
    const trackingNumber = String(formData.get("trackingNumber") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();

    await prisma.order.update({
      where: { id: orderId },
      data: {
        trackingNumber: trackingNumber || null,
        notes: notes || null,
      },
    });

    revalidatePath(`/admin/commandes/${orderId}`);
    return "Enregistré.";
  });
}
