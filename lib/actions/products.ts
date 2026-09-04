"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createProduct(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const priceRaw = String(formData.get("price") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const personalizationEnabled = formData.get("personalizationEnabled") === "on";

  if (!name || !categoryId) throw new Error("Nom et catégorie requis.");

  const product = await prisma.product.create({
    data: {
      name,
      slug: slugify(name),
      categoryId,
      price: priceRaw ? Number(priceRaw) : null,
      description: description || null,
      personalizationEnabled,
      status: "DRAFT",
      published: false,
    },
  });

  revalidatePath("/admin/produits");
  redirect(`/admin/produits/${product.id}`);
}

export async function updateProduct(productId: string, formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const personalizationEnabled = formData.get("personalizationEnabled") === "on";
  const personalizationMaxLen = Number(formData.get("personalizationMaxLen") ?? 16);
  const published = formData.get("published") === "on";

  await prisma.product.update({
    where: { id: productId },
    data: {
      name,
      price: priceRaw ? Number(priceRaw) : null,
      description: description || null,
      personalizationEnabled,
      personalizationMaxLen,
      published,
      status: published ? "PUBLISHED" : "DRAFT",
    },
  });

  revalidatePath("/admin/produits");
  revalidatePath(`/admin/produits/${productId}`);
  revalidatePath("/catalogue");
}

export async function deleteProduct(productId: string) {
  await requireAdmin();
  await prisma.product.delete({ where: { id: productId } });
  revalidatePath("/admin/produits");
  redirect("/admin/produits");
}

export async function addVariant(productId: string, formData: FormData) {
  await requireAdmin();
  const size = String(formData.get("size") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();
  const stock = Number(formData.get("stock") ?? 0);
  if (!size || !color) throw new Error("Taille et couleur requises.");

  const sku = `${productId.slice(0, 6)}-${color}-${size}`.toUpperCase().replace(/\s+/g, "");

  await prisma.productVariant.create({
    data: { productId, size, color, stock, sku },
  });

  revalidatePath(`/admin/produits/${productId}`);
}

export async function updateVariantStock(variantId: string, productId: string, stock: number) {
  await requireAdmin();
  await prisma.productVariant.update({ where: { id: variantId }, data: { stock } });
  revalidatePath(`/admin/produits/${productId}`);
}

export async function deleteVariant(variantId: string, productId: string) {
  await requireAdmin();
  await prisma.productVariant.delete({ where: { id: variantId } });
  revalidatePath(`/admin/produits/${productId}`);
}

export async function addProductImage(productId: string, formData: FormData) {
  await requireAdmin();
  const url = String(formData.get("url") ?? "").trim();
  const alt = String(formData.get("alt") ?? "").trim();
  const type = String(formData.get("type") ?? "MOCKUP") as
    | "FRONT"
    | "BACK"
    | "DETAIL"
    | "LIFESTYLE"
    | "MOCKUP";
  if (!url) throw new Error("URL requise.");

  const count = await prisma.productImage.count({ where: { productId } });

  await prisma.productImage.create({
    data: { productId, url, alt: alt || "JEUNE RICHE", type, sortOrder: count, isPrimary: count === 0 },
  });

  revalidatePath(`/admin/produits/${productId}`);
  revalidatePath("/catalogue");
}

export async function deleteProductImage(imageId: string, productId: string) {
  await requireAdmin();
  await prisma.productImage.delete({ where: { id: imageId } });
  revalidatePath(`/admin/produits/${productId}`);
}
