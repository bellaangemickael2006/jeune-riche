import type { DropStatus, OrderStatus, ReviewStatus } from "@/lib/generated/prisma/client";

// Libellés affichés dans l'admin à la place des valeurs brutes de la base
// (« COMING_SOON », « PREPARATION »…).

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  NOUVELLE: "Nouvelle",
  CONFIRMEE: "Confirmée",
  PREPARATION: "Préparation",
  EXPEDIEE: "Expédiée",
  LIVREE: "Livrée",
  ANNULEE: "Annulée",
};

export const DROP_STATUS_LABEL: Record<DropStatus, string> = {
  COMING_SOON: "Bientôt",
  PRE_ORDER: "Précommande",
  AVAILABLE: "Disponible",
  SOLD_OUT: "Épuisé",
  ENDED: "Terminé",
};

export const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  PENDING: "En attente",
  APPROVED: "Approuvé",
  REJECTED: "Refusé",
};
