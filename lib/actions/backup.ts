"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/auth";
import { logAdmin } from "@/lib/admin/audit";
import { ActionError, runAction, type ActionResult } from "@/lib/actions/result";
import { runBackup } from "@/lib/backup/run";

/** « Sauvegarder maintenant » (page Sauvegardes, propriétaires). */
export async function backupNow(): Promise<ActionResult> {
  return runAction(async () => {
    const admin = await requireAdminAction("proprietaire");
    let meta;
    try {
      meta = await runBackup();
    } catch (error) {
      console.error("[admin] sauvegarde:", error);
      throw new ActionError("Sauvegarde impossible pour le moment (Upstash ou base indisponible). Réessayez.");
    }
    const rows = Object.values(meta.counts).reduce((sum, n) => sum + n, 0);
    await logAdmin(admin, "sauvegardes.creation", `Copie du ${meta.day} : ${rows} lignes`);
    revalidatePath("/admin/sauvegardes");
    return `Sauvegarde du ${meta.day} enregistrée (${rows} lignes).`;
  });
}
