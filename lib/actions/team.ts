"use server";

import { headers } from "next/headers";
import type { Prisma } from "@/lib/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminAction } from "@/lib/auth";
import { logAdmin } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, teamAccessEmail } from "@/lib/email";
import { ActionError, runAction, type ActionResult } from "@/lib/actions/result";
import { cleanPermissions, PERMISSIONS, type Permission } from "@/lib/admin/permissions";
import { adminLink } from "@/lib/admin/gate";
import { siteUrl } from "@/lib/utils";

// Gestion de l'équipe d'administration — réservée aux propriétaires (accès
// total). Un employé ne peut donc jamais s'attribuer de nouveaux droits.

function readAccess(formData: FormData): { owner: boolean; permissions: Permission[] } {
  const owner = formData.get("proprietaire") === "on";
  const permissions = cleanPermissions(formData.getAll("permissions").map(String));
  if (!owner && permissions.length === 0) throw new ActionError("Cochez au moins un accès (ou « Tous les droits »).");
  return { owner, permissions };
}

function sectionLabels(access: { owner: boolean; permissions: Permission[] }) {
  return access.owner ? ["Tous les droits (propriétaire)"] : access.permissions.map((p) => PERMISSIONS[p].label);
}

/** Propriétaires actuels (administrateurs sans liste de droits). */
async function ownerIds() {
  try {
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true, adminAccess: { select: { userId: true } } } });
    return admins.filter((a) => !a.adminAccess).map((a) => a.id);
  } catch {
    // Table des droits absente : tous les administrateurs sont propriétaires.
    return (await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } })).map((a) => a.id);
  }
}

/** Applique les droits : ligne de droits pour un employé, aucune pour un propriétaire. */
function accessWrites(
  userId: string,
  access: { owner: boolean; permissions: Permission[] },
  invitedBy: string
): Prisma.PrismaPromise<unknown>[] {
  return access.owner
    ? [prisma.adminPermission.deleteMany({ where: { userId } })]
    : [
        prisma.adminPermission.upsert({
          where: { userId },
          create: { userId, permissions: access.permissions, invitedBy },
          update: { permissions: access.permissions },
        }),
      ];
}

async function origin() {
  return (await headers()).get("origin") || siteUrl();
}

export async function addTeamMember(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const me = await requireAdminAction("proprietaire");
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const name = String(formData.get("name") ?? "").trim().slice(0, 80) || null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ActionError("Email invalide.");
    const access = readAccess(formData);
    const invitedBy = me.name || me.email;

    // La table des droits doit exister AVANT de donner le rôle admin : sans
    // elle, l'employé aurait accès à tout.
    try {
      await prisma.adminPermission.count();
    } catch {
      throw new ActionError("Appliquez d'abord la migration « add_admin_permissions » dans Supabase, puis réessayez.");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing?.role === "ADMIN") throw new ActionError("Cette personne fait déjà partie de l'équipe : modifiez ses accès dans la liste.");

    if (existing) {
      // Compte client existant : il garde son mot de passe et son historique.
      await prisma.$transaction([
        prisma.user.update({ where: { id: existing.id }, data: { role: "ADMIN", name: existing.name ?? name } }),
        ...accessWrites(existing.id, access, invitedBy),
      ]);
      await sendEmail({
        to: email,
        subject: "Accès à l'administration JEUNE RICHE",
        html: teamAccessEmail({ actionLink: adminLink(await origin(), "/admin/login"), isNewAccount: false, invitedBy, sections: sectionLabels(access) }),
      });
      await logAdmin(me, "equipe.ajout", `${email} (compte existant) — ${sectionLabels(access).join(", ")}`, existing.id);
      revalidatePath("/admin/equipe");
      return `${email} fait maintenant partie de l'équipe (compte existant) — email envoyé.`;
    }

    // Nouveau compte : lien d'invitation vers NOTRE page d'activation (le
    // jeton n'est consommé qu'au clic sur « Activer », jamais par un simple
    // aperçu de lien dans une messagerie).
    const supabase = createAdminClient();
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "invite",
      email,
      options: { data: name ? { name } : undefined },
    });
    if (error || !data.user || !data.properties?.hashed_token) {
      throw new ActionError(`Invitation impossible : ${error?.message ?? "lien non généré"}.`);
    }

    try {
      const created = await prisma.user.create({ data: { supabaseId: data.user.id, email, name, role: "ADMIN" } });
      await prisma.$transaction(accessWrites(created.id, access, invitedBy));
    } catch (err) {
      // Pas de compte de connexion orphelin si la fiche n'a pas pu être créée.
      await prisma.user.deleteMany({ where: { supabaseId: data.user.id } }).catch(() => undefined);
      await supabase.auth.admin.deleteUser(data.user.id).catch(() => undefined);
      throw err;
    }

    const link = adminLink(
      await origin(),
      `/admin/activer?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=invite`
    );
    const sent = await sendEmail({
      to: email,
      subject: "Invitation à l'administration JEUNE RICHE",
      html: teamAccessEmail({ actionLink: link, isNewAccount: true, invitedBy, sections: sectionLabels(access) }),
    });
    await logAdmin(me, "equipe.ajout", `${email} (invitation) — ${sectionLabels(access).join(", ")}`);
    revalidatePath("/admin/equipe");
    return sent.sent
      ? `Invitation envoyée à ${email}.`
      : `Compte créé, mais l'email n'a pas pu partir (SMTP). Transmettez ce lien à ${email} : ${link}`;
  });
}

export async function updateTeamMember(userId: string, formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const me = await requireAdminAction("proprietaire");
    if (userId === me.id) throw new ActionError("Vous ne pouvez pas modifier vos propres accès.");
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, email: true } });
    if (target?.role !== "ADMIN") throw new ActionError("Membre introuvable.");
    const access = readAccess(formData);

    const owners = await ownerIds();
    if (!access.owner && owners.includes(userId) && owners.length <= 1) {
      throw new ActionError("Il doit rester au moins un propriétaire.");
    }
    await prisma.$transaction(accessWrites(userId, access, me.name || me.email));
    await logAdmin(me, "equipe.modification", `${target.email} — ${sectionLabels(access).join(", ")}`, userId);
    revalidatePath("/admin/equipe");
    return "Accès mis à jour.";
  });
}

export async function removeTeamMember(userId: string): Promise<ActionResult> {
  return runAction(async () => {
    const me = await requireAdminAction("proprietaire");
    if (userId === me.id) throw new ActionError("Vous ne pouvez pas vous retirer vous-même de l'équipe.");
    const owners = await ownerIds();
    if (owners.includes(userId) && owners.length <= 1) throw new ActionError("Il doit rester au moins un propriétaire.");

    // L'accès admin est retiré ; le compte reste utilisable comme client.
    // Le rôle d'abord : c'est lui qui ferme l'accès, même sans table de droits.
    const removed = await prisma.user.update({ where: { id: userId }, data: { role: "CLIENT" } });
    await prisma.adminPermission.deleteMany({ where: { userId } }).catch(() => undefined);
    await logAdmin(me, "equipe.retrait", removed.email, userId);
    revalidatePath("/admin/equipe");
    return "Accès à l'administration retiré.";
  });
}
