import "server-only";
import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { ensureClientUser } from "@/lib/account/syncUser";

/**
 * Fin commune des connexions Google (via Supabase ou en direct) : crée la
 * fiche client à la première connexion, puis demande le numéro WhatsApp que
 * Google ne fournit pas.
 */
export async function finishGoogleLogin(supabase: SupabaseClient, authUser: User, next: string, origin: string) {
  let needsPhone = false;
  try {
    const user = await ensureClientUser(authUser);
    needsPhone = !user.addressPhone;
  } catch (err) {
    // Sans fiche client, le compte serait inutilisable (commandes, avis) :
    // on ne laisse pas une session à moitié ouverte.
    console.error("[auth] ensureClientUser:", err);
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/compte?erreur=google_compte", origin));
  }

  if (needsPhone) {
    return NextResponse.redirect(new URL(`/compte/telephone?next=${encodeURIComponent(next)}`, origin));
  }
  return NextResponse.redirect(new URL(next, origin));
}
