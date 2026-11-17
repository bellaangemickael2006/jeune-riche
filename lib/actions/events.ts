"use server";

import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminAction } from "@/lib/auth";
import { logAdmin } from "@/lib/admin/audit";
import { ActionError, runAction, type ActionResult } from "@/lib/actions/result";

const HEX = /^#[0-9a-fA-F]{6}$/;

function readEvent(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const startsAt = new Date(String(formData.get("startsAt") ?? ""));
  const endsAt = new Date(String(formData.get("endsAt") ?? ""));
  const accentRaw = String(formData.get("accent") ?? "").trim();
  const bannerText = String(formData.get("bannerText") ?? "").trim();

  if (!name) throw new ActionError("Le nom est obligatoire.");
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    throw new ActionError("Dates invalides.");
  }
  if (endsAt <= startsAt) throw new ActionError("La fin doit être après le début.");
  if (bannerText.length > 140) throw new ActionError("Texte de bannière trop long (140 caractères max).");

  return {
    name,
    startsAt,
    endsAt,
    accent: HEX.test(accentRaw) ? accentRaw : "#C8102E",
    bannerText: bannerText || null,
    enabled: formData.get("enabled") === "on",
    effectSnow: formData.get("effectSnow") === "on",
    effectLights: formData.get("effectLights") === "on",
  };
}

function refresh() {
  updateTag("seasonal-events");
  revalidatePath("/admin/evenements");
}

export async function createEvent(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const admin = await requireAdminAction("accueil");
    const data = readEvent(formData);
    const event = await prisma.seasonalEvent.create({ data });
    await logAdmin(admin, "evenements.creation", `Événement « ${data.name} »`, event.id);
    refresh();
    return "Événement créé.";
  });
}

export async function updateEvent(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const admin = await requireAdminAction("accueil");
    const id = String(formData.get("id") ?? "");
    const data = readEvent(formData);
    await prisma.seasonalEvent.update({ where: { id }, data });
    await logAdmin(
      admin,
      "evenements.modification",
      `Événement « ${data.name} » ${data.enabled ? "activé" : "désactivé"}`,
      id
    );
    refresh();
    return "Événement enregistré.";
  });
}

export async function deleteEvent(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const admin = await requireAdminAction("accueil");
    const id = String(formData.get("id") ?? "");
    const event = await prisma.seasonalEvent.delete({ where: { id } });
    await logAdmin(admin, "evenements.suppression", `Événement « ${event.name} »`, id);
    refresh();
    return "Événement supprimé.";
  });
}
