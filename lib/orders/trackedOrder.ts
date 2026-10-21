import "server-only";
import { prisma } from "@/lib/prisma";
import { trackingStepIndex } from "@/lib/orders/tracking";

export type TrackedOrder = {
  orderNumber: string;
  step: number | null; // null = annulée
  createdAt: string;
  updatedAt: string;
  trackingNumber: string | null;
  total: number;
  items: { name: string; size: string; color: string; quantity: number }[];
};

type OrderForTracking = NonNullable<Awaited<ReturnType<typeof findOrder>>>;

function findOrder(where: { id: string } | { orderNumber: string }) {
  return prisma.order.findUnique({ where, include: { items: true } });
}

/** Commande brute (avec email et téléphone, pour la vérification) — jamais renvoyée telle quelle au navigateur. */
export async function findOrderForTracking(where: { id: string } | { orderNumber: string }) {
  return findOrder(where);
}

/**
 * Ce que voit le client : l'avancement et le contenu. Ni adresse, ni
 * téléphone, ni email — même au bon destinataire, rien de personnel ne
 * repart du serveur.
 */
export function toTrackedOrder(order: OrderForTracking): TrackedOrder {
  return {
    orderNumber: order.orderNumber,
    step: trackingStepIndex(order.status),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    trackingNumber: order.status === "EXPEDIEE" || order.status === "LIVREE" ? order.trackingNumber : null,
    total: Number(order.total),
    items: order.items.map((i) => ({ name: i.productName, size: i.size, color: i.color, quantity: i.quantity })),
  };
}
