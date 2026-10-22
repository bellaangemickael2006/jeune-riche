// Clés VAPID des notifications (Web Push).
//
// La clé PUBLIQUE n'a rien de secret (chaque navigateur la reçoit pour
// s'abonner) : elle est écrite ici, dans le code. Avant, elle venait d'une
// variable Vercel ; une valeur mal collée (deux lignes en une) avait rendu
// l'abonnement impossible ET publié la clé privée dans le code du site.
//
// La clé PRIVÉE reste un secret, uniquement côté serveur : variable Vercel
// VAPID_PRIVATE_KEY, qui doit former une paire avec la clé ci-dessous.
// Changer de paire : node -e "console.log(require('web-push').generateVAPIDKeys())",
// remplacer cette constante et la variable Vercel, redéployer.

export const VAPID_PUBLIC_KEY = "BFBIIiEX121C8b0WblxfV6U_FRI1WguIOE_LnabkPjmPOzG7StkhASjVj_t_vu3XJ-BVJwbQZcIJVOdKVwd7oVI";

// Clé privée : 32 octets en base64url = 43 caractères.
const PRIVATE_KEY = /^[A-Za-z0-9_-]{43}$/;

/** Clé privée utilisable (espaces, guillemets ou lignes en trop retirés), ou null. */
export function vapidPrivateKey(raw: string | undefined | null): string | null {
  const line = String(raw ?? "").split(/\r?\n/)[0] ?? "";
  const value = line.trim().replace(/^["']|["']$/g, "").trim();
  return PRIVATE_KEY.test(value) ? value : null;
}
