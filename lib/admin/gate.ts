// Porte d'entrée secrète de l'administration.
//
// Sans elle, /admin répondait à tout le monde et un simple scanner trouvait
// la page de connexion en quelques secondes, prête pour une attaque par
// force brute. Désormais /admin (et tout ce qu'il contient) répond le 404
// standard du site, identique à n'importe quelle adresse inexistante, SAUF
// pour un navigateur passé une fois par l'adresse secrète
// `/<ADMIN_ENTRY_KEY>`, qui y dépose un cookie signé valable 30 jours.
//
// ADMIN_ENTRY_KEY : variable d'environnement (Vercel), 32 caractères
// aléatoires minimum (lettres, chiffres, - et _). Absente ou trop courte :
// la porte est désactivée et l'admin reste accessible comme avant
// (développement local, CI). Changer la clé ferme la porte à tous les
// navigateurs déjà entrés (redéploiement nécessaire).
//
// Utilisée par next.config.ts (réécritures), proxy.ts (entrée secrète) et
// les emails ; testée unitairement.

import { createHmac } from "node:crypto";
// Chemin relatif : ce fichier est chargé par next.config.ts, qui ne connaît pas l'alias « @/ ».
import { internalPath } from "../account/safeNext";

export const ADMIN_GATE_COOKIE = "jr_ag";
export const ADMIN_GATE_MAX_AGE = 30 * 24 * 3600; // 30 jours
const MIN_KEY_LENGTH = 32;

export function adminEntryKey(): string | null {
  const key = process.env.ADMIN_ENTRY_KEY?.trim();
  return key && key.length >= MIN_KEY_LENGTH && /^[A-Za-z0-9_-]+$/.test(key) ? key : null;
}

/** Valeur du cookie : HMAC-SHA256 de la clé — impossible à fabriquer sans elle. */
export function gateCookieValue(key: string): string {
  return createHmac("sha256", key).update("jeune-riche-admin-gate-v1").digest("base64url");
}

/**
 * Réécritures de next.config.ts : sans le cookie signé, /admin et tout ce
 * qu'il contient sont servis comme une page inexistante (404 standard du
 * site). Faite dans la config et non dans le proxy : une réécriture du
 * proxy laissait un en-tête x-middleware-rewrite visible, qui trahissait
 * la différence avec une vraie page introuvable.
 */
export function adminGateRewrites() {
  const key = adminEntryKey();
  if (!key) return [];
  // base64url : uniquement [A-Za-z0-9_-], rien à échapper dans l'expression.
  const exact = "^" + gateCookieValue(key) + "$";
  const missing = [{ type: "cookie" as const, key: ADMIN_GATE_COOKIE, value: exact }];
  return [
    { source: "/admin", missing, destination: "/introuvable" },
    { source: "/admin/:path*", missing, destination: "/introuvable" },
  ];
}

/** Comparaison à temps constant (pas d'indice sur la longueur du préfixe correct). */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Destination après l'entrée secrète : uniquement une page de l'admin. */
export function adminNext(raw: string | null): string {
  const path = internalPath(raw);
  return path && (path === "/admin" || path.startsWith("/admin/") || path.startsWith("/admin?")) ? path : "/admin";
}

/**
 * Lien vers une page de l'admin à mettre dans un email (invitation,
 * nouvelle commande) : passe par l'entrée secrète, pour que le lien
 * fonctionne même sur un appareil qui n'a pas encore le cookie.
 */
export function adminLink(origin: string, path: string): string {
  const key = adminEntryKey();
  return key ? `${origin}/${key}?next=${encodeURIComponent(path)}` : `${origin}${path}`;
}
