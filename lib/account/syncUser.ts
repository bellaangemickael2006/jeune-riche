import "server-only";
import type { User as AuthUser } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

/** Nom affichable fourni par Google (full_name) ou par l'inscription (name). */
function displayName(authUser: AuthUser): string | null {
  const meta = authUser.user_metadata ?? {};
  const value = [meta.full_name, meta.name].find((v) => typeof v === "string" && v.trim());
  return typeof value === "string" ? value.trim().slice(0, 80) : null;
}

/**
 * Garantit la ligne `users` d'un client connecté par un fournisseur externe
 * (Google). L'inscription par email crée cette ligne elle-même (voir
 * api/account/signup) ; avec Google, la première connexion EST l'inscription.
 *
 * - Déjà connu (même compte Supabase) : on complète seulement le nom s'il manquait.
 * - Email déjà présent sous un autre compte Supabase (ancien compte email
 *   supprimé/recréé côté Supabase) : la ligne client est rattachée au compte
 *   Google, dont l'email est vérifié par Google — l'historique de commandes
 *   est conservé. Jamais pour un administrateur : un accès admin ne se
 *   récupère pas par une connexion Google.
 * - Sinon : nouveau client.
 */
export async function ensureClientUser(authUser: AuthUser) {
  const email = authUser.email?.trim().toLowerCase();
  if (!email) throw new Error("Compte sans email");
  const name = displayName(authUser);

  const bySupabaseId = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
  if (bySupabaseId) {
    if (!bySupabaseId.name && name) {
      return prisma.user.update({ where: { id: bySupabaseId.id }, data: { name } });
    }
    return bySupabaseId;
  }

  const byEmail = await prisma.user.findUnique({ where: { email } });
  if (byEmail) {
    if (byEmail.role === "ADMIN") throw new Error("Email administrateur lié à un autre compte");
    return prisma.user.update({
      where: { id: byEmail.id },
      data: { supabaseId: authUser.id, name: byEmail.name ?? name },
    });
  }

  return prisma.user.create({
    data: { supabaseId: authUser.id, email, name, role: "CLIENT" },
  });
}
