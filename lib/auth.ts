import { cache } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ActionError } from "@/lib/actions/result";
import { cleanPermissions, hasPermission, PERMISSIONS, type AdminPermissions, type Permission } from "@/lib/admin/permissions";

/**
 * Administrateur connecté et ses droits (null = propriétaire, accès total).
 * Redirige vers la connexion si personne n'est connecté ou si le compte
 * n'est pas administrateur.
 *
 * Le frontend n'est jamais considéré comme une protection suffisante (règle
 * #91) : à appeler en tout début de CHAQUE page admin et de chaque action,
 * avant la moindre lecture en base — le layout et la page s'exécutent en
 * parallèle, un contrôle placé seulement dans le layout laissait la page lire
 * et envoyer ses données avant la redirection. `cache` évite de refaire les
 * requêtes quand le layout et la page l'appellent dans la même requête.
 */
export const getAdminAccess = cache(async () => {
  // Admin caché par l'entrée secrète (proxy.ts) : 404 ordinaire, jamais une
  // redirection vers la connexion qui trahirait l'existence de l'admin.
  if ((await headers()).get("x-jr-admin-hidden") === "1") notFound();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    redirect("/admin/login?erreur=config_manquante");
  }

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect("/admin/login");

  let dbUser;
  try {
    dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
  } catch (error) {
    console.error("[auth] requireAdmin:", error);
    redirect("/admin/login?erreur=base_indisponible");
  }

  if (!dbUser || dbUser.role !== "ADMIN") redirect("/admin/login?erreur=acces_refuse");

  // Sans table de droits (migration pas encore appliquée), tout administrateur
  // garde l'accès total, comme avant l'arrivée des droits par section.
  let permissions: AdminPermissions = null;
  try {
    const row = await prisma.adminPermission.findUnique({ where: { userId: dbUser.id } });
    if (row) permissions = cleanPermissions(row.permissions);
  } catch {
    permissions = null;
  }

  return { user: dbUser, permissions, isOwner: permissions === null };
});

/** Pour les pages et routes admin : redirige vers l'accueil admin si le droit manque. */
export async function requireAdmin(permission?: Permission | "proprietaire") {
  const access = await getAdminAccess();
  if (permission && !allowed(access.permissions, permission)) {
    redirect(`/admin?acces=refuse&section=${permission}`);
  }
  return access.user;
}

/** Pour les server actions : message lisible plutôt qu'une redirection. */
export async function requireAdminAction(permission?: Permission | "proprietaire") {
  const access = await getAdminAccess();
  if (permission && !allowed(access.permissions, permission)) {
    throw new ActionError(
      permission === "proprietaire"
        ? "Action réservée au propriétaire de la boutique."
        : `Accès refusé : vous n'avez pas le droit « ${PERMISSIONS[permission].label} ».`
    );
  }
  return access.user;
}

function allowed(permissions: AdminPermissions, permission: Permission | "proprietaire") {
  return permission === "proprietaire" ? permissions === null : hasPermission(permissions, permission);
}
