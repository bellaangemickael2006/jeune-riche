const BASE = "https://jeune-riche.invalid";

/**
 * Chemin interne normalisé, ou null s'il mènerait ailleurs. L'adresse est
 * analysée comme le ferait le navigateur, pas comparée en texte : un simple
 * contrôle « commence par // » laissait passer « /<tabulation>/site-pirate.com »
 * (le navigateur supprime tabulations et retours à la ligne, ce qui donne
 * « //site-pirate.com »), ou des barres obliques inversées.
 */
export function internalPath(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith("/")) return null;
  try {
    const url = new URL(raw, BASE);
    return url.origin === BASE ? url.pathname + url.search + url.hash : null;
  } catch {
    return null;
  }
}

/**
 * Destination après connexion : chemin interne uniquement. Sans ce contrôle,
 * un lien piégé « …/auth/callback?next=//site-pirate.com » renverrait le
 * client, tout juste connecté, vers un autre site.
 */
export function safeNext(raw: string | null, fallback = "/?login=1") {
  return internalPath(raw) ?? fallback;
}
