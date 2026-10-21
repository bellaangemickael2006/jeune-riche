// Inscription à la newsletter en deux temps (« double opt-in ») : le
// formulaire n'inscrit personne, il envoie un lien signé à l'adresse saisie,
// et seule la personne qui reçoit l'email peut confirmer. Avant, n'importe
// qui pouvait inscrire l'adresse d'un autre, qui recevait alors toutes les
// annonces.
//
// Jeton signé (HMAC, même clé que la désinscription), valable 7 jours, sans
// rien enregistrer en base avant la confirmation.

import { createHmac } from "node:crypto";
import { safeEqual } from "@/lib/admin/gate";
import { emailTokenSecret } from "@/lib/unsubscribe";
import { siteUrl } from "@/lib/utils";

export type SubscribeSource = "newsletter" | "drop";
export const SUBSCRIBE_TOKEN_DAYS = 7;

const DAY_MS = 86_400_000;

function sign(payload: string, key: string) {
  return createHmac("sha256", key).update(`subscribe:${payload}`).digest("base64url");
}

export function makeSubscribeToken(email: string, source: SubscribeSource, now = Date.now()): string | null {
  const key = emailTokenSecret();
  if (!key) return null;
  const payload = Buffer.from(JSON.stringify({ e: email.trim().toLowerCase(), s: source, d: Math.floor(now / DAY_MS) })).toString(
    "base64url"
  );
  return `${payload}.${sign(payload, key)}`;
}

/** Adresse et origine contenues dans le jeton, ou null s'il est faux, altéré ou expiré. */
export function readSubscribeToken(token: string, now = Date.now()): { email: string; source: SubscribeSource } | null {
  const key = emailTokenSecret();
  const [payload, signature] = String(token).split(".");
  if (!key || !payload || !signature || !safeEqual(signature, sign(payload, key))) return null;
  try {
    const { e, s, d } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof e !== "string" || !e.includes("@") || (s !== "newsletter" && s !== "drop") || typeof d !== "number") return null;
    const age = Math.floor(now / DAY_MS) - d;
    if (age < 0 || age > SUBSCRIBE_TOKEN_DAYS) return null;
    return { email: e, source: s };
  } catch {
    return null;
  }
}

export function subscribeConfirmUrl(email: string, source: SubscribeSource): string | null {
  const token = makeSubscribeToken(email, source);
  return token ? `${siteUrl()}/newsletter/confirmer?t=${token}` : null;
}
