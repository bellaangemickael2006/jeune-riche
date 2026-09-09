import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export type PromoValidationResult =
  | { valid: true; code: string; promoCodeId: string; discountAmount: number }
  | { valid: false; message: string };

// Utilisé à la fois par l'aperçu client (app/api/promo/validate) et par la
// commande réelle (app/api/checkout) — jamais confiance au montant calculé
// côté navigateur, la remise est toujours recalculée ici depuis la base.
export async function resolvePromoCode(rawCode: string, subtotal: number): Promise<PromoValidationResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { valid: false, message: "Code requis." };

  const promo = await prisma.promoCode.findUnique({ where: { code } });
  if (!promo || !promo.active) return { valid: false, message: "Code promo invalide." };
  if (promo.expiresAt && promo.expiresAt.getTime() < Date.now()) {
    return { valid: false, message: "Ce code a expiré." };
  }
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
    return { valid: false, message: "Ce code n'est plus disponible." };
  }
  if (promo.minSubtotal !== null && subtotal < Number(promo.minSubtotal)) {
    return { valid: false, message: `Ce code s'applique à partir de ${formatPrice(Number(promo.minSubtotal))} d'achat.` };
  }

  const discountAmount =
    promo.type === "PERCENT"
      ? Math.round(subtotal * (Number(promo.value) / 100))
      : Math.min(Number(promo.value), subtotal);

  return { valid: true, code: promo.code, promoCodeId: promo.id, discountAmount };
}
