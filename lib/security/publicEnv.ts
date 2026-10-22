// Garde-fou de compilation : les variables NEXT_PUBLIC_* sont recopiées
// telles quelles dans le code envoyé aux navigateurs. Une valeur mal collée
// dans Vercel peut donc publier un secret — c'est arrivé : la clé publique
// des notifications contenait aussi la ligne « VAPID_PRIVATE_KEY=… ».
// next.config.ts refuse de compiler dans ce cas, plutôt que de publier.
// Fonction pure, testée.

// Plusieurs lignes, ou une affectation « NOM=… » au milieu de la valeur.
const SUSPICIOUS = /[\r\n]|(?:^|\s)[A-Z][A-Z0-9_]{2,}=/;

/** Noms des variables publiques dont la valeur semble contenir autre chose qu'elle-même. */
export function suspiciousPublicEnv(env: Record<string, string | undefined>): string[] {
  return Object.entries(env)
    .filter(([name, value]) => name.startsWith("NEXT_PUBLIC_") && typeof value === "string" && SUSPICIOUS.test(value))
    .map(([name]) => name)
    .sort();
}
