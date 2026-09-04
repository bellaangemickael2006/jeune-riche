import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * Vérifie côté serveur qu'un administrateur est connecté.
 * Le frontend n'est jamais considéré comme une protection suffisante (règle #91).
 */
export async function requireAdmin() {
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

  return dbUser;
}
