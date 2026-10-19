"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminAction } from "@/lib/auth";
import { ActionError, runAction, uniqueSlug, type ActionResult } from "@/lib/actions/result";
import type { DropStatus } from "@prisma/client";

const STATUSES: DropStatus[] = ["COMING_SOON", "PRE_ORDER", "AVAILABLE", "SOLD_OUT", "ENDED"];

function readDates(formData: FormData) {
  const startsAtRaw = String(formData.get("startsAt") ?? "");
  const endsAtRaw = String(formData.get("endsAt") ?? "");
  if (!startsAtRaw) throw new ActionError("Date de début requise.");

  const startsAt = new Date(startsAtRaw);
  const endsAt = endsAtRaw ? new Date(endsAtRaw) : null;
  if (Number.isNaN(startsAt.getTime()) || (endsAt && Number.isNaN(endsAt.getTime()))) {
    throw new ActionError("Date invalide.");
  }
  if (endsAt && endsAt.getTime() <= startsAt.getTime()) {
    throw new ActionError("La date de fin doit être après la date de début.");
  }
  return { startsAt, endsAt };
}

function revalidateDrops(dropId?: string) {
  // La page publique /drops est servie en statique depuis le build : sans
  // revalidation, un drop modifié n'y apparaît jamais. Le statut et les dates
  // sont aussi embarqués dans les requêtes produits (compte à rebours).
  revalidatePath("/admin/drops");
  if (dropId) revalidatePath(`/admin/drops/${dropId}`);
  revalidatePath("/drops");
  revalidateTag("products");
}

export async function createDrop(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdminAction("produits");
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    if (!name) throw new ActionError("Nom requis.");
    const { startsAt, endsAt } = readDates(formData);

    const slug = await uniqueSlug(name, async (s) => Boolean(await prisma.drop.findUnique({ where: { slug: s } })));
    await prisma.drop.create({
      data: {
        name,
        slug,
        description: description || null,
        startsAt,
        endsAt,
        // Un drop créé avec une date de début déjà passée est immédiatement
        // disponible — le laisser sur COMING_SOON afficherait "Bientôt" pour
        // un produit déjà en vente. L'admin peut le corriger ensuite.
        status: startsAt.getTime() <= Date.now() ? "AVAILABLE" : "COMING_SOON",
      },
    });

    revalidateDrops();
    return `Drop « ${name} » créé.`;
  });
}

export async function updateDrop(dropId: string, formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdminAction("produits");
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const status = String(formData.get("status") ?? "") as DropStatus;
    if (!name) throw new ActionError("Nom requis.");
    if (!STATUSES.includes(status)) throw new ActionError("Statut inconnu.");
    const { startsAt, endsAt } = readDates(formData);

    await prisma.drop.update({
      where: { id: dropId },
      data: { name, startsAt, endsAt, description: description || null, status },
    });

    revalidateDrops(dropId);
    return "Drop enregistré.";
  });
}

export async function deleteDrop(dropId: string): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdminAction("produits");
    // Détache les produits plutôt que de les supprimer — un drop qui se
    // termine ne doit jamais entraîner la disparition des produits eux-mêmes.
    await prisma.$transaction([
      prisma.product.updateMany({ where: { dropId }, data: { dropId: null } }),
      prisma.drop.delete({ where: { id: dropId } }),
    ]);
    revalidateDrops();
    redirect("/admin/drops");
  });
}

export async function assignProductToDrop(dropId: string, formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdminAction("produits");
    const productId = String(formData.get("productId") ?? "");
    if (!productId) throw new ActionError("Choisissez un produit.");

    await prisma.product.update({ where: { id: productId }, data: { dropId } });
    revalidateDrops(dropId);
  });
}

export async function removeProductFromDrop(dropId: string, productId: string): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdminAction("produits");
    await prisma.product.update({ where: { id: productId }, data: { dropId: null } });
    revalidateDrops(dropId);
  });
}
