"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import type { OrderStatus } from "@prisma/client";

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  await requireAdmin();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw new Error("Commande introuvable.");

  // Annuler une commande qui ne l'était pas déjà remet le stock des articles
  // commandés — sans quoi le stock décrémenté au paiement resterait
  // définitivement perdu. On ne le fait qu'une seule fois (transition vers
  // ANNULEE depuis un autre statut), jamais si elle est déjà annulée.
  const isCancelling = status === "ANNULEE" && order.status !== "ANNULEE";

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { status } });
    if (isCancelling) {
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }
  });

  revalidatePath("/admin/commandes");
  revalidatePath(`/admin/commandes/${orderId}`);
}

export async function updateOrderFulfillment(orderId: string, formData: FormData) {
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
}
