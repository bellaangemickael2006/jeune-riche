"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createCategory(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sortOrderRaw = String(formData.get("sortOrder") ?? "").trim();
  if (!name) throw new Error("Nom requis.");

  await prisma.category.create({
    data: {
      name,
      slug: slugify(name),
      description: description || null,
      sortOrder: sortOrderRaw ? Number(sortOrderRaw) : 0,
    },
  });

  revalidateTag("categories");
  revalidatePath("/admin/categories");
}

export async function updateCategory(categoryId: string, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sortOrderRaw = String(formData.get("sortOrder") ?? "").trim();
  if (!name) throw new Error("Nom requis.");

  await prisma.category.update({
    where: { id: categoryId },
    data: {
      name,
      description: description || null,
      sortOrder: sortOrderRaw ? Number(sortOrderRaw) : 0,
    },
  });

  revalidateTag("categories");
  revalidatePath("/admin/categories");
}

export async function deleteCategory(categoryId: string) {
  await requireAdmin();

  const productCount = await prisma.product.count({ where: { categoryId } });
  if (productCount > 0) {
    throw new Error(
      `Impossible de supprimer : ${productCount} produit(s) utilisent encore cette catégorie.`
    );
  }

  await prisma.category.delete({ where: { id: categoryId } });
  revalidateTag("categories");
  revalidatePath("/admin/categories");
}
