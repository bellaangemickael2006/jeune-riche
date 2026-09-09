"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import type { PromoType } from "@prisma/client";

export async function createPromoCode(formData: FormData) {
  await requireAdmin();

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const type = String(formData.get("type") ?? "") as PromoType;
  const valueRaw = String(formData.get("value") ?? "").trim();
  const expiresAtRaw = String(formData.get("expiresAt") ?? "").trim();
  const minSubtotalRaw = String(formData.get("minSubtotal") ?? "").trim();
  const maxUsesRaw = String(formData.get("maxUses") ?? "").trim();

  if (!code || !valueRaw) throw new Error("Code et valeur requis.");
  const value = Number(valueRaw);
  if (type === "PERCENT" && (value <= 0 || value > 100)) {
    throw new Error("Un pourcentage doit être compris entre 1 et 100.");
  }
  if (type === "FIXED" && value <= 0) throw new Error("Le montant doit être positif.");

  await prisma.promoCode.create({
    data: {
      code,
      type,
      value,
      expiresAt: expiresAtRaw ? new Date(expiresAtRaw) : null,
      minSubtotal: minSubtotalRaw ? Number(minSubtotalRaw) : null,
      maxUses: maxUsesRaw ? Number(maxUsesRaw) : null,
    },
  });

  revalidatePath("/admin/codes-promo");
}

export async function togglePromoCode(id: string, active: boolean) {
  await requireAdmin();
  await prisma.promoCode.update({ where: { id }, data: { active } });
  revalidatePath("/admin/codes-promo");
}

export async function deletePromoCode(id: string) {
  await requireAdmin();
  await prisma.promoCode.delete({ where: { id } });
  revalidatePath("/admin/codes-promo");
}
