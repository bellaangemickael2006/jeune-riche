// Connexion Google en direct, sans passer par l'adresse Supabase.
//
// Avec signInWithOAuth, Google renvoie vers <projet>.supabase.co et affiche
// donc « Accéder à l'application smmrsifrxmmpzrasfogv.supabase.co ». Ici,
// Google renvoie vers NOTRE site (/auth/google), qui échange le code contre
// le jeton d'identité Google, puis ouvre la session Supabase avec ce jeton
// (signInWithIdToken). Google affiche alors le nom du site, ou le nom de
// l'application une fois la marque validée dans Google Cloud.
//
// Fonctions pures, testées unitairement ; la route est app/auth/google.

import { createHash, randomBytes } from "node:crypto";

export const GOOGLE_STATE_COOKIE = "jr_google";
export const GOOGLE_STATE_MAX_AGE = 10 * 60; // 10 minutes pour choisir son compte

export type GoogleState = { state: string; nonce: string; next: string };

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** Google reçoit l'empreinte du nonce ; Supabase reçoit le nonce brut et compare. */
export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function googleAuthUrl(params: { clientId: string; redirectUri: string; state: string; nonce: string }): string {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", params.state);
  url.searchParams.set("nonce", sha256Hex(params.nonce));
  // Toujours proposer le choix du compte : sur un téléphone partagé ou avec
  // plusieurs comptes Google, le client choisit lequel utiliser.
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

export function encodeGoogleState(value: GoogleState): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

export function decodeGoogleState(raw: string | undefined): GoogleState | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (typeof value?.state !== "string" || typeof value?.nonce !== "string" || typeof value?.next !== "string") return null;
    return value;
  } catch {
    return null;
  }
}

/** Réglages présents sur Vercel ? Sans eux, le site garde la connexion via Supabase. */
export function googleDirectConfig() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}
