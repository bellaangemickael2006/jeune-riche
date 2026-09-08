"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import type { DropStatus } from "@prisma/client";

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createDrop(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const startsAtRaw = String(formData.get("startsAt") ?? "");
  const endsAtRaw = String(formData.get("endsAt") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  if (!name || !startsAtRaw) throw new Error("Nom et date requis.");

  const startsAt = new Date(startsAtRaw);
  const endsAt = endsAtRaw ? new Date(endsAtRaw) : null;
  if (endsAt && endsAt.getTime() <= startsAt.getTime()) {
    throw new Error("La date de fin doit être après la date de début.");
  }

  await prisma.drop.create({
    data: {
      name,
      slug: slugify(name),
      description: description || null,
      startsAt,
      endsAt,
      // Un drop créé avec une date de début déjà passée est immédiatement
      // disponible — le laisser sur COMING_SOON afficherait "Bientôt" pour
      // un produit déjà en vente. Reste un point de départ : l'admin garde
      // la main pour le corriger (ex. PRE_ORDER) depuis la fiche du drop.
      status: startsAt.getTime() <= Date.now() ? "AVAILABLE" : "COMING_SOON",
    },
  });

  // La page publique /drops n'appelle aucune API dynamique : Next.js la sert
  // en statique depuis le build. Sans cette ligne, un drop créé après coup
  // n'apparaît jamais tant qu'aucun autre déclencheur ne revalide la page.
  revalidatePath("/admin/drops");
  revalidatePath("/drops");
}

export async function updateDrop(dropId: string, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const startsAtRaw = String(formData.get("startsAt") ?? "");
  const endsAtRaw = String(formData.get("endsAt") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "") as DropStatus;
  if (!name || !startsAtRaw) throw new Error("Nom et date requis.");

  const startsAt = new Date(startsAtRaw);
  const endsAt = endsAtRaw ? new Date(endsAtRaw) : null;
  if (endsAt && endsAt.getTime() <= startsAt.getTime()) {
    throw new Error("La date de fin doit être après la date de début.");
  }

  await prisma.drop.update({
    where: { id: dropId },
    data: {
      name,
      startsAt,
      endsAt,
      description: description || null,
      status,
    },
  });

  // Le statut/les dates du drop sont aussi embarqués dans les requêtes
  // produits (include: { drop: true }, utilisées pour le compte à rebours
  // sur le catalogue et les fiches produit) — sans revalidateTag, ces pages
  // garderaient d'anciennes dates jusqu'à expiration naturelle du cache.
  revalidatePath("/admin/drops");
  revalidatePath(`/admin/drops/${dropId}`);
  revalidatePath("/drops");
  revalidateTag("products");
}

export async function deleteDrop(dropId: string) {
  await requireAdmin();
  // Détache les produits plutôt que de les supprimer — un drop qui se
  // termine ne doit jamais entraîner la disparition des produits eux-mêmes.
  await prisma.product.updateMany({ where: { dropId }, data: { dropId: null } });
  await prisma.drop.delete({ where: { id: dropId } });
  revalidatePath("/admin/drops");
  revalidatePath("/drops");
  revalidateTag("products");
  redirect("/admin/drops");
}

export async function assignProductToDrop(dropId: string, formData: FormData) {
  await requireAdmin();
  const productId = String(formData.get("productId") ?? "");
  if (!productId) throw new Error("Produit requis.");

  await prisma.product.update({ where: { id: productId }, data: { dropId } });
  revalidateTag("products");
  revalidatePath(`/admin/drops/${dropId}`);
}

export async function removeProductFromDrop(dropId: string, productId: string) {
  await requireAdmin();
  await prisma.product.update({ where: { id: productId }, data: { dropId: null } });
  revalidateTag("products");
  revalidatePath(`/admin/drops/${dropId}`);
}
