import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { AuditAction } from "@/lib/admin/auditLabels";

type Actor = { id: string; email: string } | { id: null; email: string };

/**
 * Inscrit une action dans le journal de l'admin. Toujours APRÈS l'opération
 * et sans jamais lever d'erreur : l'action a déjà eu lieu, un journal
 * indisponible (table pas encore migrée) ne doit rien bloquer.
 */
export async function logAdmin(actor: Actor, action: AuditAction, summary: string, target?: string | null) {
  try {
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    await prisma.adminLog.create({
      data: {
        actorId: actor.id,
        actorEmail: actor.email.toLowerCase().slice(0, 254),
        action,
        summary: summary.slice(0, 500),
        target: target ?? null,
        ip: ip?.slice(0, 64) ?? null,
      },
    });
  } catch (error) {
    console.error("[admin] journal non enregistré:", error);
  }
}
