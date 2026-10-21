"use server";

import { revalidatePath } from "next/cache";
import { getAdminAccess, requireAdminAction } from "@/lib/auth";
import { logAdmin } from "@/lib/admin/audit";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { ActionError, runAction, type ActionResult } from "@/lib/actions/result";

/** Inscrit au journal l'enregistrement d'un téléphone (appelé juste après, donc déjà vérifié). */
export async function recordMfaEnrolled(): Promise<void> {
  try {
    const { user } = await getAdminAccess();
    await logAdmin(user, "connexion.2fa_activee", "Double vérification activée sur un téléphone");
  } catch (error) {
    // redirect() d'une session non vérifiée : rien à inscrire.
    if (!(error instanceof Error && error.message === "NEXT_REDIRECT")) console.error("[admin] journal 2FA:", error);
  }
}

/**
 * Propriétaires : efface le téléphone enregistré d'un membre (téléphone
 * perdu). Il devra en enregistrer un nouveau à sa prochaine connexion.
 */
export async function resetMemberMfa(userId: string): Promise<ActionResult> {
  return runAction(async () => {
    const me = await requireAdminAction("proprietaire");
    if (userId === me.id) {
      throw new ActionError("Vous ne pouvez pas réinitialiser votre propre double vérification : demandez à un autre propriétaire.");
    }
    const member = await prisma.user.findUnique({ where: { id: String(userId) }, select: { role: true, email: true, supabaseId: true } });
    if (member?.role !== "ADMIN") throw new ActionError("Membre introuvable.");

    const admin = createAdminClient().auth.admin.mfa;
    const { data, error } = await admin.listFactors({ userId: member.supabaseId });
    if (error) throw new ActionError(`Réinitialisation impossible : ${error.message}.`);
    for (const factor of data?.factors ?? []) {
      const { error: deleteError } = await admin.deleteFactor({ userId: member.supabaseId, id: factor.id });
      if (deleteError) throw new ActionError(`Réinitialisation impossible : ${deleteError.message}.`);
    }
    await logAdmin(me, "equipe.2fa_reinitialisee", member.email, userId);
    revalidatePath("/admin/equipe");
    return `Double vérification réinitialisée pour ${member.email} : un nouveau téléphone lui sera demandé à sa prochaine connexion.`;
  });
}
