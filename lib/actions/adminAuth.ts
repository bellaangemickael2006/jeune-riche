"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rateLimit";
import { logAdmin } from "@/lib/admin/audit";

export type AdminSignInResult = { ok: true } | { ok: false; error: string };

const INVALID = "Identifiants invalides.";

// Ralentit chaque échec d'environ une demi-seconde : imperceptible pour une
// personne, mais une attaque par force brute en devient d'autant plus lente.
function pause() {
  return new Promise((resolve) => setTimeout(resolve, 400 + Math.floor(Math.random() * 300)));
}

/**
 * Connexion à l'administration, faite côté serveur pour pouvoir la limiter
 * (avant, le navigateur appelait Supabase directement, sans aucun frein) :
 * 5 essais par 15 min par adresse IP, 10 par heure par email (partagé entre
 * toutes les instances si Upstash est configuré, voir lib/rateLimit.ts).
 * Un compte client reçoit le même « Identifiants invalides » qu'un mauvais
 * mot de passe : rien ne révèle quelles adresses sont celles de l'équipe.
 */
export async function adminSignIn(email: string, password: string): Promise<AdminSignInResult> {
  const normalized = String(email ?? "").trim().toLowerCase().slice(0, 254);
  const secret = String(password ?? "");
  if (!normalized || !secret) return { ok: false, error: INVALID };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const allowedIp = await rateLimit(`admin-login-ip:${ip}`, 5, 15 * 60_000);
  const allowedEmail = await rateLimit(`admin-login-email:${normalized}`, 10, 60 * 60_000);
  if (!allowedIp || !allowedEmail) {
    console.warn(`[admin] connexion bloquée (trop d'essais) — ip ${ip}, compte ${normalized}`);
    return { ok: false, error: "Trop de tentatives. Réessayez dans 15 minutes." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: normalized, password: secret });
  if (error || !data.user) {
    await logAdmin({ id: null, email: normalized }, "connexion.refusee", "Mauvais mot de passe ou compte inconnu");
    await pause();
    return { ok: false, error: INVALID };
  }

  const dbUser = await prisma.user
    .findUnique({ where: { supabaseId: data.user.id }, select: { id: true, role: true } })
    .catch(() => null);
  if (dbUser?.role !== "ADMIN") {
    await supabase.auth.signOut();
    await logAdmin({ id: null, email: normalized }, "connexion.refusee", "Compte sans accès à l’administration");
    await pause();
    return { ok: false, error: INVALID };
  }
  await logAdmin({ id: dbUser.id, email: normalized }, "connexion.reussie", "Connexion à l’administration");
  return { ok: true };
}
