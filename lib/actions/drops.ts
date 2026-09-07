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
  const startsAt = String(formData.get("startsAt") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  if (!name || !startsAt) throw new Error("Nom et date requis.");

  await prisma.drop.create({
    data: {
      name,
      slug: slugify(name),
      description: description || null,
      startsAt: new Date(startsAt),
      status: "COMING_SOON",
    },
  });

  revalidatePath("/admin/drops");
}

export async function updateDrop(dropId: string, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const startsAt = String(formData.get("startsAt") ?? "");
  const endsAt = String(formData.get("endsAt") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "") as DropStatus;
  if (!name || !startsAt) throw new Error("Nom et date requis.");

  await prisma.drop.update({
    where: { id: dropId },
    data: {
      name,
      startsAt: new Date(startsAt),
      endsAt: endsAt ? new Date(endsAt) : null,
      description: description || null,
      status,
    },
  });

  revalidatePath("/admin/drops");
  revalidatePath(`/admin/drops/${dropId}`);
}

export async function deleteDrop(dropId: string) {
  await requireAdmin();
  // Détache les produits plutôt que de les supprimer — un drop qui se
  // termine ne doit jamais entraîner la disparition des produits eux-mêmes.
  await prisma.product.updateMany({ where: { dropId }, data: { dropId: null } });
  await prisma.drop.delete({ where: { id: dropId } });
  revalidatePath("/admin/drops");
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
