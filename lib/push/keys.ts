// Clés VAPID des notifications (Web Push), dérivées du secret serveur
// CRON_SECRET (HKDF), comme la clé des sauvegardes (lib/backup/format.ts) :
// rien de plus à configurer sur Vercel.
//
// Avant, la paire venait de variables Vercel ; une valeur mal collée avait
// publié la clé privée dans le code du site. Désormais la clé privée n'est
// jamais saisie nulle part : elle est recalculée à l'identique par le
// serveur, et seule la clé publique sort (GET /api/push, pour s'abonner).
// L'ancienne variable VAPID_PRIVATE_KEY (clé qui a fuité) n'est plus lue.
//
// Changer CRON_SECRET change la paire : les abonnements existants cessent
// de recevoir (les clients réactivent « Me prévenir »). Fonctions pures, testées.

import { createECDH, hkdfSync } from "node:crypto";

export type VapidKeys = { publicKey: string; privateKey: string };

/** Paire VAPID (base64url) propre à ce secret, ou null sans secret. */
export function deriveVapidKeys(secret: string | null | undefined): VapidKeys | null {
  if (!secret) return null;
  // Une clé privée P-256 doit être dans [1, n-1] : en pratique le premier
  // essai convient (échec ~2^-32) ; on retente avec un autre libellé sinon.
  for (let attempt = 0; attempt < 8; attempt++) {
    const privateKey = Buffer.from(hkdfSync("sha256", secret, "jeune-riche-vapid", `v1:${attempt}`, 32));
    try {
      const ecdh = createECDH("prime256v1");
      ecdh.setPrivateKey(privateKey);
      return { publicKey: ecdh.getPublicKey().toString("base64url"), privateKey: privateKey.toString("base64url") };
    } catch {
      // clé hors de la courbe : essai suivant
    }
  }
  return null;
}
