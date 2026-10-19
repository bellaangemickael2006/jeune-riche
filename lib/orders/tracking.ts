// Suivi de commande public : étapes affichées au client et vérification de
// son identité. Sans dépendance serveur (testé unitairement).

import type { OrderStatus } from "@prisma/client";

export const TRACKING_STEPS = ["received", "preparing", "shipped", "delivered"] as const;
export type TrackingStep = (typeof TRACKING_STEPS)[number];

/** Index de l'étape atteinte, ou null pour une commande annulée. */
export function trackingStepIndex(status: OrderStatus): number | null {
  switch (status) {
    case "NOUVELLE":
    case "CONFIRMEE":
      return 0;
    case "PREPARATION":
      return 1;
    case "EXPEDIEE":
      return 2;
    case "LIVREE":
      return 3;
    case "ANNULEE":
      return null;
  }
}

/** « jr-abc123 », « JR ABC123 » → « JR-ABC123 ». */
export function normalizeOrderNumber(raw: string) {
  const compact = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return compact.startsWith("JR") ? `JR-${compact.slice(2)}` : `JR-${compact}`;
}

function digits(value: string) {
  return value.replace(/\D/g, "");
}

/**
 * Le numéro de commande seul ne suffit pas (il se devine : horodatage en
 * base 36) : le client doit aussi donner l'email OU le téléphone de la
 * commande. Le téléphone est comparé sur ses 8 derniers chiffres, pour
 * accepter indifféremment « +225 07… » et « 07… ».
 */
export function contactMatches(contact: string, order: { customerEmail: string; phone: string | null }) {
  const value = contact.trim();
  if (!value) return false;
  if (value.includes("@")) {
    return Boolean(order.customerEmail) && value.toLowerCase() === order.customerEmail.trim().toLowerCase();
  }
  const given = digits(value);
  const stored = digits(order.phone ?? "");
  return given.length >= 8 && stored.length >= 8 && given.slice(-8) === stored.slice(-8);
}
