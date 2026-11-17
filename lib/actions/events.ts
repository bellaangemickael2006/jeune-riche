"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const HEX = /^#[0-9a-fA-F]{6}$/;

function readEvent(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const startsAt = new Date(String(formData.get("startsAt") ?? ""));
  const endsAt = new Date(String(formData.get("endsAt") ?? ""));
  const accentRaw = String(formData.get("accent") ?? "").trim();
  const bannerText = String(formData.get("bannerText") ?? "").trim();

  if (!name) throw new Error("Le nom est obligatoire.");
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    throw new Error("Dates invalides.");
  }
  if (endsAt <= startsAt) throw new Error("La fin doit être après le début.");

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
  revalidateTag("seasonal-events");
  revalidatePath("/admin/evenements");
}

export async function createEvent(formData: FormData) {
  await requireAdmin();
  await prisma.seasonalEvent.create({ data: readEvent(formData) });
  refresh();
}

export async function updateEvent(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await prisma.seasonalEvent.update({ where: { id }, data: readEvent(formData) });
  refresh();
}

export async function deleteEvent(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await prisma.seasonalEvent.delete({ where: { id } });
  refresh();
}
