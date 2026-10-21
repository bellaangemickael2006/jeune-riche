// Liens « Ne plus recevoir… » des emails automatiques (rappel de panier,
// annonces de drops). Le jeton est signé (HMAC) : impossible de désinscrire
// quelqu'un d'autre en devinant ou en modifiant l'adresse. La désinscription
// elle-même demande un clic sur une page de confirmation, jamais un simple
// chargement du lien (les antivirus de messagerie ouvrent les liens).

import { createHmac } from "node:crypto";
import { safeEqual } from "@/lib/admin/gate";
import { siteUrl } from "@/lib/utils";

export type UnsubscribeKind = "rappel" | "newsletter";
export const UNSUBSCRIBE_KINDS: UnsubscribeKind[] = ["rappel", "newsletter"];

/** Clé des liens signés envoyés par email (désinscription, confirmation d'inscription). */
export function emailTokenSecret(): string | null {
  return process.env.AUTH_SECRET || process.env.CRON_SECRET || null;
}

function sign(kind: UnsubscribeKind, email: string, key: string) {
  return createHmac("sha256", key).update(`unsubscribe:${kind}:${email}`).digest("base64url");
}

export function makeUnsubscribeToken(kind: UnsubscribeKind, email: string): string | null {
  const key = emailTokenSecret();
  if (!key) return null;
  const normalized = email.trim().toLowerCase();
  return `${Buffer.from(normalized).toString("base64url")}.${sign(kind, normalized, key)}`;
}

/** Email contenu dans le jeton, ou null si le jeton est faux ou altéré. */
export function readUnsubscribeToken(kind: UnsubscribeKind, token: string): string | null {
  const key = emailTokenSecret();
  const [encoded, signature] = token.split(".");
  if (!key || !encoded || !signature) return null;
  const email = Buffer.from(encoded, "base64url").toString("utf8");
  if (!email.includes("@")) return null;
  return safeEqual(signature, sign(kind, email, key)) ? email : null;
}

/** Lien complet à mettre dans un email, ou null si aucun secret n'est configuré. */
export function unsubscribeUrl(kind: UnsubscribeKind, email: string): string | null {
  const token = makeUnsubscribeToken(kind, email);
  return token ? `${siteUrl()}/desinscription?type=${kind}&t=${token}` : null;
}
