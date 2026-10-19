/**
 * Destination après connexion : chemin interne uniquement. Sans ce contrôle,
 * un lien piégé « …/auth/callback?next=//site-pirate.com » renverrait le
 * client, tout juste connecté, vers un autre site.
 */
export function safeNext(raw: string | null, fallback = "/?login=1") {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}
