// Clés VAPID des notifications (Web Push), lues prudemment : une valeur mal
// collée dans Vercel (guillemets, espaces, deux lignes en une…) donnait une
// clé invalide, et l'abonnement échouait sans explication. Fonctions pures,
// testées ; utilisées côté navigateur (bouton) et côté serveur (envoi).

// Clé publique : point P-256 non compressé (65 octets) en base64url = 87 caractères.
const PUBLIC_KEY = /^[A-Za-z0-9_-]{87}$/;
// Clé privée : 32 octets en base64url = 43 caractères.
const PRIVATE_KEY = /^[A-Za-z0-9_-]{43}$/;

function firstValue(raw: string | undefined | null) {
  const line = String(raw ?? "").split(/\r?\n/)[0] ?? "";
  return line.trim().replace(/^["']|["']$/g, "").trim();
}

/** Clé publique utilisable, ou null (absente ou mal collée). */
export function vapidPublicKey(raw: string | undefined | null): string | null {
  const value = firstValue(raw);
  return PUBLIC_KEY.test(value) ? value : null;
}

/** Clé privée utilisable, ou null. */
export function vapidPrivateKey(raw: string | undefined | null): string | null {
  const value = firstValue(raw);
  return PRIVATE_KEY.test(value) ? value : null;
}
