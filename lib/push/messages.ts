// Notifications sur le téléphone du client (Web Push) : textes et règles,
// sans dépendance serveur (testé unitairement). L'envoi est dans send.ts.

import type { OrderStatus } from "@/lib/generated/prisma/client";

/** Ce qui vient de changer sur la commande. */
export type OrderPushEvent = { kind: "status"; status: OrderStatus } | { kind: "tracking"; trackingNumber: string };

type Texts = {
  status: Partial<Record<OrderStatus, string>>;
  tracking: string;
  title: string;
};

// Français et anglais ; les autres langues reçoivent l'anglais.
const TEXTS: Record<"fr" | "en", Texts> = {
  fr: {
    title: "JEUNE RICHE — commande {number}",
    status: {
      CONFIRMEE: "Votre commande est confirmée.",
      PREPARATION: "Votre commande est en préparation.",
      EXPEDIEE: "Votre commande est expédiée, elle arrive bientôt.",
      LIVREE: "Votre commande est livrée. Merci pour votre confiance !",
      ANNULEE: "Votre commande a été annulée.",
    },
    tracking: "Numéro de suivi ajouté : {tracking}",
  },
  en: {
    title: "JEUNE RICHE — order {number}",
    status: {
      CONFIRMEE: "Your order is confirmed.",
      PREPARATION: "Your order is being prepared.",
      EXPEDIEE: "Your order has shipped and is on its way.",
      LIVREE: "Your order has been delivered. Thank you!",
      ANNULEE: "Your order has been cancelled.",
    },
    tracking: "Tracking number added: {tracking}",
  },
};

/** Titre et texte de la notification, ou null si l'étape ne mérite pas d'alerter (ex. « Nouvelle »). */
export function orderPushMessage(event: OrderPushEvent, orderNumber: string, locale: string) {
  const texts = TEXTS[locale === "fr" ? "fr" : "en"];
  const body =
    event.kind === "status" ? texts.status[event.status] : texts.tracking.replace("{tracking}", event.trackingNumber);
  if (!body) return null;
  return { title: texts.title.replace("{number}", orderNumber), body };
}

/** Une commande terminée n'aura plus de nouvelles : ses abonnements « suivi » sont supprimés. */
export function isFinalStatus(status: OrderStatus) {
  return status === "LIVREE" || status === "ANNULEE";
}

export const orderScope = (orderId: string) => `order:${orderId}`;
export const userScope = (userId: string) => `user:${userId}`;

/** Abonnements gardés au plus par portée (un client a rarement plus de quelques appareils). */
export const MAX_SUBSCRIPTIONS_PER_SCOPE = 10;

// Le serveur envoie une requête à l'adresse donnée par le navigateur : on
// n'accepte que les services de notification des navigateurs, jamais une
// adresse quelconque (sinon le site servirait de relais vers n'importe où).
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /(^|\.)push\.services\.mozilla\.com$/, /(^|\.)push\.apple\.com$/, /(^|\.)notify\.windows\.com$/];

export function isPushEndpoint(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.port && PUSH_HOSTS.some((host) => host.test(url.hostname));
  } catch {
    return false;
  }
}
