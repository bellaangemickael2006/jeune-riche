"use server";

import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminAction } from "@/lib/auth";
import { logAdmin } from "@/lib/admin/audit";
import { ActionError, runAction, type ActionResult } from "@/lib/actions/result";
import { MANUAL_REASONS, MOVEMENT_REASONS, nextStock, type MovementReason, type StockMode } from "@/lib/stock/labels";
import { notifyRestock, recordMovements } from "@/lib/stock/movements";

type BulkStockInput = {
  mode: StockMode;
  reason: MovementReason;
  note: string;
  changes: { variantId: string; value: number }[];
};

/**
 * Modifie le stock de plusieurs variantes d'un produit en une fois.
 * « set » = nouvelle valeur ; « add » = entrée (+) ou sortie (−).
 * Tout ou rien : une seule variante refusée (stock négatif) annule l'ensemble.
 */
export async function bulkUpdateStock(productId: string, input: BulkStockInput): Promise<ActionResult> {
  return runAction(async () => {
    const admin = await requireAdminAction("produits");
    if (input.mode !== "set" && input.mode !== "add") throw new ActionError("Mode inconnu.");
    if (!MANUAL_REASONS.includes(input.reason)) throw new ActionError("Motif inconnu.");
    const note = String(input.note ?? "").trim().slice(0, 200) || null;
    const changes = (input.changes ?? []).filter((c) => typeof c?.variantId === "string" && Number.isFinite(c.value));
    if (changes.length === 0) throw new ActionError("Aucune quantité modifiée.");
    if (changes.length > 300) throw new ActionError("Trop de variantes en une fois.");

    const variants = await prisma.productVariant.findMany({
      where: { productId, id: { in: changes.map((c) => c.variantId) } },
      select: { id: true, stock: true, color: true, size: true },
    });
    const byId = new Map(variants.map((v) => [v.id, v]));

    const plan = changes.map((c) => {
      const variant = byId.get(c.variantId);
      if (!variant) throw new ActionError("Une variante n'appartient pas à ce produit. Rechargez la page.");
      const after = nextStock(variant.stock, c.value, input.mode);
      if (after === null) {
        throw new ActionError(`${variant.color} / ${variant.size} : le stock ne peut pas passer sous zéro (actuel : ${variant.stock}).`);
      }
      return { variant, after };
    });
    const effective = plan.filter((p) => p.after !== p.variant.stock);
    if (effective.length === 0) return "Aucun changement : les quantités sont déjà à jour.";

    // Comparer-échanger sur la valeur lue : si une vente a modifié une
    // variante entre-temps, on refuse plutôt que d'écraser cette vente.
    await prisma.$transaction(async (tx) => {
      for (const { variant, after } of effective) {
        const result = await tx.productVariant.updateMany({
          where: { id: variant.id, stock: variant.stock },
          data: { stock: after },
        });
        if (result.count === 0) {
          throw new ActionError(`${variant.color} / ${variant.size} vient d'être modifié (vente en cours ?). Rechargez la page et recommencez.`);
        }
      }
    });

    await recordMovements(
      effective.map(({ variant, after }) => ({
        variantId: variant.id,
        productId,
        delta: after - variant.stock,
        stockAfter: after,
        reason: input.reason,
        note,
        actorEmail: admin.email,
      }))
    );
    const notified = await notifyRestock(effective.filter((p) => p.variant.stock <= 0 && p.after > 0).map((p) => p.variant.id));

    const product = await prisma.product.findUnique({ where: { id: productId }, select: { name: true } }).catch(() => null);
    await logAdmin(
      admin,
      "stock.modification",
      `« ${product?.name ?? "Produit"} » (${MOVEMENT_REASONS[input.reason]}) : ` +
        effective.map(({ variant, after }) => `${variant.color} / ${variant.size} ${variant.stock} → ${after}`).join(", "),
      productId
    );
    updateTag("products");
    revalidatePath(`/admin/produits/${productId}`);
    revalidatePath(`/admin/produits/${productId}/stock`);
    revalidatePath("/admin/stock");
    revalidatePath("/admin");
    const units = effective.reduce((sum, p) => sum + (p.after - p.variant.stock), 0);
    const summary = `${effective.length} variante${effective.length > 1 ? "s" : ""} mise${effective.length > 1 ? "s" : ""} à jour (${units >= 0 ? "+" : ""}${units} pièce${Math.abs(units) > 1 ? "s" : ""})`;
    return notified > 0 ? `${summary} — ${notified} client(s) prévenu(s) du retour en stock.` : `${summary}.`;
  });
}
