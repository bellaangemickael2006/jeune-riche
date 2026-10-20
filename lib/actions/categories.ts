"use server";

import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminAction } from "@/lib/auth";
import { logAdmin } from "@/lib/admin/audit";
import { ActionError, readInt, runAction, uniqueSlug, type ActionResult } from "@/lib/actions/result";

function revalidateCategories() {
  updateTag("categories");
  revalidatePath("/admin/categories");
  revalidatePath("/catalogue");
}

export async function createCategory(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const admin = await requireAdminAction("produits");
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const sortOrder = readInt(formData, "sortOrder", "Ordre d'affichage") ?? 0;
    if (!name) throw new ActionError("Nom requis.");
    if (await prisma.category.findUnique({ where: { name } })) {
      throw new ActionError(`La catégorie « ${name} » existe déjà.`);
    }

    const slug = await uniqueSlug(name, async (s) => Boolean(await prisma.category.findUnique({ where: { slug: s } })));
    await prisma.category.create({
      data: { name, slug, description: description || null, sortOrder },
    });

    await logAdmin(admin, "categories.creation", `Catégorie « ${name} »`);
    revalidateCategories();
    return `Catégorie « ${name} » créée.`;
  });
}

export async function updateCategory(categoryId: string, formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const admin = await requireAdminAction("produits");
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const sortOrder = readInt(formData, "sortOrder", "Ordre d'affichage") ?? 0;
    if (!name) throw new ActionError("Nom requis.");

    const sameName = await prisma.category.findUnique({ where: { name } });
    if (sameName && sameName.id !== categoryId) throw new ActionError(`La catégorie « ${name} » existe déjà.`);

    await prisma.category.update({
      where: { id: categoryId },
      data: { name, description: description || null, sortOrder },
    });

    await logAdmin(admin, "categories.modification", `Catégorie « ${name} »`, categoryId);
    revalidateCategories();
    return "Enregistré.";
  });
}

export async function deleteCategory(categoryId: string): Promise<ActionResult> {
  return runAction(async () => {
    const admin = await requireAdminAction("produits");

    const productCount = await prisma.product.count({ where: { categoryId } });
    if (productCount > 0) {
      throw new ActionError(`Impossible de supprimer : ${productCount} produit(s) utilisent encore cette catégorie.`);
    }

    const category = await prisma.category.delete({ where: { id: categoryId } });
    await logAdmin(admin, "categories.suppression", `Catégorie « ${category.name} »`, categoryId);
    revalidateCategories();
  });
}
