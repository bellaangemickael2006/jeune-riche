import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureClientUser } from "@/lib/account/syncUser";

// Appelé juste après la validation du code SMS : la session existe côté
// Supabase, mais la fiche client (commandes, avis, adresse) est créée ici,
// comme le fait app/auth/callback pour une connexion Google.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  try {
    await ensureClientUser(authUser);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/account/sync]", error);
    // Sans fiche client le compte serait inutilisable : pas de session à moitié ouverte.
    await supabase.auth.signOut();
    return NextResponse.json({ error: "Compte indisponible." }, { status: 500 });
  }
}
