// Suivi de commande en temps réel (page /suivi).
//
// Après une vérification réussie (numéro + email ou téléphone), le serveur
// remet au navigateur :
//  - un jeton signé, valable 24 h, qui permet de relire l'état de CETTE
//    commande sans redemander l'email (route /api/suivi) ;
//  - le nom d'un canal temps réel propre à la commande. Quand l'équipe
//    modifie la commande dans l'admin, un simple signal « mise à jour » y
//    est envoyé (aucune donnée), et la page relit l'état avec son jeton.
// Le nom du canal est une signature : impossible à deviner, donc personne
// d'autre n'est prévenu des changements d'une commande.
//
// Fonctions pures, testées ; clé partagée avec les liens des emails.

import { createHmac } from "node:crypto";
import { safeEqual } from "@/lib/admin/gate";
import { emailTokenSecret } from "@/lib/unsubscribe";

export const TRACKING_TOKEN_HOURS = 24;

function sign(value: string, key: string) {
  return createHmac("sha256", key).update(value).digest("base64url");
}

export function makeTrackingToken(orderId: string, now = Date.now()): string | null {
  const key = emailTokenSecret();
  if (!key) return null;
  const expires = now + TRACKING_TOKEN_HOURS * 3_600_000;
  const payload = Buffer.from(`${orderId}.${expires}`).toString("base64url");
  return `${payload}.${sign(`suivi:${payload}`, key)}`;
}

/** Identifiant de la commande, ou null si le jeton est faux, altéré ou expiré. */
export function readTrackingToken(token: string | null | undefined, now = Date.now()): string | null {
  const key = emailTokenSecret();
  const [payload, signature] = String(token ?? "").split(".");
  if (!key || !payload || !signature || !safeEqual(signature, sign(`suivi:${payload}`, key))) return null;
  const [orderId, expires] = Buffer.from(payload, "base64url").toString("utf8").split(".");
  if (!orderId || !Number.isFinite(Number(expires)) || Number(expires) < now) return null;
  return orderId;
}

/** Canal temps réel d'une commande (même nom côté serveur et navigateur). */
export function trackingChannel(orderId: string): string | null {
  const key = emailTokenSecret();
  return key ? `suivi:${sign(`canal:${orderId}`, key).slice(0, 32)}` : null;
}
