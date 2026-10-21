import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/account/safeNext";
import { finishGoogleLogin } from "@/lib/account/finishLogin";
import {
  GOOGLE_STATE_COOKIE,
  GOOGLE_STATE_MAX_AGE,
  decodeGoogleState,
  encodeGoogleState,
  googleAuthUrl,
  googleDirectConfig,
  randomToken,
} from "@/lib/account/googleOAuth";

// « Continuer avec Google » sans passer par l'adresse Supabase (voir
// lib/account/googleOAuth.ts). Une seule adresse, deux temps :
//  1. sans `code` : départ vers Google, avec un état anti-falsification et un
//     nonce gardés dans un cookie ;
//  2. avec `code` : retour de Google, échange du code contre le jeton
//     d'identité, puis ouverture de la session Supabase.

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const redirectUri = `${origin}/auth/google`;
  // Le cookie d'état ne sert qu'une fois : effacé à chaque issue (même chemin).
  const clearState = (response: NextResponse) => {
    response.cookies.set(GOOGLE_STATE_COOKIE, "", { path: "/auth/google", maxAge: 0 });
    return response;
  };
  const fail = (reason: string) => clearState(NextResponse.redirect(new URL(`/compte?erreur=${reason}`, origin)));

  const config = googleDirectConfig();
  if (!config) return fail("google");

  // 1. Départ vers Google.
  if (!searchParams.has("code") && !searchParams.has("error")) {
    const saved = { state: randomToken(), nonce: randomToken(), next: safeNext(searchParams.get("next")) };
    const response = NextResponse.redirect(
      googleAuthUrl({ clientId: config.clientId, redirectUri, state: saved.state, nonce: saved.nonce })
    );
    response.cookies.set(GOOGLE_STATE_COOKIE, encodeGoogleState(saved), {
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
      // lax : renvoyé au retour de Google, qui est une navigation normale.
      sameSite: "lax",
      path: "/auth/google",
      maxAge: GOOGLE_STATE_MAX_AGE,
    });
    return response;
  }

  // 2. Retour de Google. « Annuler » sur l'écran Google : error=access_denied.
  if (searchParams.get("error")) return fail("google_annule");
  const saved = decodeGoogleState(request.cookies.get(GOOGLE_STATE_COOKIE)?.value);
  const code = searchParams.get("code");
  // L'état doit être celui posé au départ par CE navigateur : sinon, un lien
  // piégé pourrait connecter la victime au compte Google de l'attaquant.
  if (!saved || !code || searchParams.get("state") !== saved.state) return fail("google");

  let idToken: string | undefined;
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
      cache: "no-store",
    });
    const body = (await res.json()) as { id_token?: string; error?: string };
    if (!res.ok) console.error("[auth/google] échange du code:", res.status, body.error);
    idToken = body.id_token;
  } catch (error) {
    console.error("[auth/google] échange du code:", error);
  }
  if (!idToken) return fail("google");

  // Supabase vérifie la signature Google, le destinataire (même identifiant
  // client que dans Authentication → Providers → Google) et le nonce.
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithIdToken({ provider: "google", token: idToken, nonce: saved.nonce });
  if (error || !data.user) {
    console.error("[auth/google] signInWithIdToken:", error);
    return fail("google");
  }

  return clearState(await finishGoogleLogin(supabase, data.user, saved.next, origin));
}
