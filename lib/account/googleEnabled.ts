import "server-only";

/**
 * Connexion Google active dans Supabase (Authentication → Providers) ? Même
 * lecture des réglages publics que le bouton côté navigateur
 * (components/account/GoogleSignInButton.tsx), gardée 5 minutes en cache.
 * En cas de doute (réseau, réglages illisibles) : false, le site retombe
 * sur l'inscription par email plutôt que de bloquer tout le monde.
 */
export async function isGoogleSignInEnabled(): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  try {
    const res = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: key },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return false;
    const settings = (await res.json()) as { external?: { google?: boolean } };
    return Boolean(settings.external?.google);
  } catch {
    return false;
  }
}
