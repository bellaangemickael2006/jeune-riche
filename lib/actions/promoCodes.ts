"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminAction } from "@/lib/auth";
import { ActionError, readAmount, readInt, runAction, type ActionResult } from "@/lib/actions/result";
import type { PromoType } from "@prisma/client";

export async function createPromoCode(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdminAction("promos");

    const code = String(formData.get("code") ?? "").trim().toUpperCase().replace(/\s+/g, "");
    const type = String(formData.get("type") ?? "") as PromoType;
    const value = readAmount(formData, "value", "Valeur");
    const expiresAtRaw = String(formData.get("expiresAt") ?? "").trim();
    const minSubtotal = readAmount(formData, "minSubtotal", "Panier minimum");
    const maxUses = readInt(formData, "maxUses", "Utilisations max");

    if (!code || value === null) throw new ActionError("Code et valeur requis.");
    if (type !== "PERCENT" && type !== "FIXED") throw new ActionError("Type de remise inconnu.");
    // Avant, une valeur non numérique (NaN) passait ces contrôles.
    if (type === "PERCENT" && (value <= 0 || value > 100)) {
      throw new ActionError("Un pourcentage doit être compris entre 1 et 100.");
    }
    if (type === "FIXED" && value <= 0) throw new ActionError("Le montant doit être positif.");
    if (maxUses === 0) throw new ActionError("Utilisations max : au moins 1 (laisser vide pour illimité).");

    // Fin de journée : un code « expire le 31 » doit rester valable le 31.
    const expiresAt = expiresAtRaw ? new Date(`${expiresAtRaw}T23:59:59`) : null;
    if (expiresAt && Number.isNaN(expiresAt.getTime())) throw new ActionError("Date d'expiration invalide.");

    if (await prisma.promoCode.findUnique({ where: { code } })) {
      throw new ActionError(`Le code « ${code} » existe déjà.`);
    }

    await prisma.promoCode.create({
      data: { code, type, value, expiresAt, minSubtotal, maxUses },
    });

    revalidatePath("/admin/codes-promo");
    return `Code ${code} créé.`;
  });
}

export async function togglePromoCode(id: string, active: boolean): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdminAction("promos");
    await prisma.promoCode.update({ where: { id }, data: { active } });
    revalidatePath("/admin/codes-promo");
  });
}

export async function deletePromoCode(id: string): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdminAction("promos");
    await prisma.promoCode.delete({ where: { id } });
    revalidatePath("/admin/codes-promo");
  });
}
