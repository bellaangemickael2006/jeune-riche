"use client";

// Fournisseurs de connexion réellement activés dans Supabase (Authentication
// → Providers), lus une seule fois sur les réglages publics du projet. Un
// bouton ou formulaire n'apparaît que si son fournisseur fonctionne : sinon
// le client tomberait sur une page d'erreur brute de Supabase.
export type AuthProviders = { google: boolean; phone: boolean };

let providers: Promise<AuthProviders> | null = null;

export function getAuthProviders(): Promise<AuthProviders> {
  providers ??= fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "" },
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((settings: { external?: { google?: boolean; phone?: boolean } } | null) => ({
      google: Boolean(settings?.external?.google),
      phone: Boolean(settings?.external?.phone),
    }))
    .catch(() => ({ google: false, phone: false }));
  return providers;
}
