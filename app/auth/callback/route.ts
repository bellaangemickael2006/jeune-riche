import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { finishGoogleLogin } from "@/lib/account/finishLogin";
import { safeNext } from "@/lib/account/safeNext";

// Retour de Google (via Supabase) après « Continuer avec Google ». Supabase
// renvoie un code à usage unique (flux PKCE) qu'on échange ici contre la
// session, posée en cookies sur NOTRE domaine, puis on crée la fiche client
// si c'est la première connexion.

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));
  const fail = (reason: string) => NextResponse.redirect(new URL(`/compte?erreur=${reason}`, origin));

  // Refus sur l'écran Google (« Annuler ») : Supabase renvoie error=access_denied.
  if (searchParams.get("error")) return fail("google_annule");
  if (!code) return fail("google");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    console.error("[auth/callback] exchangeCodeForSession:", error);
    return fail("google");
  }

  return finishGoogleLogin(supabase, data.user, next, origin);
}
