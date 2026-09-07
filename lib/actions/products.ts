"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const MEDIA_BUCKET = "product-media";
const MAX_MEDIA_BYTES = 25 * 1024 * 1024; // 25 Mo, suffisant pour photo/courte vidéo produit

let bucketEnsured = false;

async function ensureMediaBucket() {
  if (bucketEnsured) return;
  const supabase = createAdminClient();
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some((b) => b.name === MEDIA_BUCKET)) {
    await supabase.storage.createBucket(MEDIA_BUCKET, {
      public: true,
      fileSizeLimit: MAX_MEDIA_BYTES,
    });
  }
  bucketEnsured = true;
}

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

  revalidateTag("products");
  revalidatePath("/admin/produits");
  redirect(`/admin/produits/${product.id}`);
}

export async function updateProduct(productId: string, formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const personalizationEnabled = formData.get("personalizationEnabled") === "on";
  const personalizationMaxLen = Number(formData.get("personalizationMaxLen") ?? 16);
  const published = formData.get("published") === "on";

  await prisma.product.update({
    where: { id: productId },
    data: {
      name,
      ...(categoryId ? { categoryId } : {}),
      price: priceRaw ? Number(priceRaw) : null,
      description: description || null,
      personalizationEnabled,
      personalizationMaxLen,
      published,
      status: published ? "PUBLISHED" : "DRAFT",
    },
  });

  revalidateTag("products");
  revalidatePath("/admin/produits");
  revalidatePath(`/admin/produits/${productId}`);
  revalidatePath("/catalogue");
}

export async function deleteProduct(productId: string) {
  await requireAdmin();
  try {
    await prisma.product.delete({ where: { id: productId } });
  } catch {
    throw new Error(
      "Impossible de supprimer : ce produit apparaît dans au moins une commande existante. Dépubliez-le plutôt que de le supprimer."
    );
  }
  revalidateTag("products");
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
  const file = formData.get("file");
  const alt = String(formData.get("alt") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();
  const type = String(formData.get("type") ?? "MOCKUP") as
    | "FRONT"
    | "BACK"
    | "DETAIL"
    | "LIFESTYLE"
    | "MOCKUP";

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Fichier image requis.");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("Le fichier sélectionné n'est pas une image.");
  }
  if (file.size > MAX_MEDIA_BYTES) {
    throw new Error("Fichier trop volumineux (25 Mo max).");
  }

  await ensureMediaBucket();
  const supabase = createAdminClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });
  if (uploadError) throw new Error(`Échec de l'upload : ${uploadError.message}`);

  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);

  const count = await prisma.productImage.count({ where: { productId } });

  await prisma.productImage.create({
    data: {
      productId,
      url: data.publicUrl,
      alt: alt || "JEUNE RICHE",
      color: color || null,
      type,
      sortOrder: count,
      isPrimary: count === 0,
    },
  });

  revalidateTag("products");
  revalidatePath(`/admin/produits/${productId}`);
  revalidatePath("/catalogue");
}

export async function deleteProductImage(imageId: string, productId: string) {
  await requireAdmin();
  await prisma.productImage.delete({ where: { id: imageId } });
  revalidateTag("products");
  revalidatePath(`/admin/produits/${productId}`);
}

export async function setProductVideo(productId: string, formData: FormData) {
  await requireAdmin();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Fichier vidéo requis.");
  }
  if (!file.type.startsWith("video/")) {
    throw new Error("Le fichier sélectionné n'est pas une vidéo.");
  }
  if (file.size > MAX_MEDIA_BYTES) {
    throw new Error("Fichier trop volumineux (25 Mo max).");
  }

  await ensureMediaBucket();
  const supabase = createAdminClient();
  const ext = file.name.split(".").pop() || "mp4";
  const path = `${productId}/video-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });
  if (uploadError) throw new Error(`Échec de l'upload : ${uploadError.message}`);

  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);

  await prisma.product.update({ where: { id: productId }, data: { videoUrl: data.publicUrl } });

  revalidateTag("products");
  revalidatePath(`/admin/produits/${productId}`);
  revalidatePath("/catalogue");
}

export async function removeProductVideo(productId: string) {
  await requireAdmin();
  await prisma.product.update({ where: { id: productId }, data: { videoUrl: null } });
  revalidateTag("products");
  revalidatePath(`/admin/produits/${productId}`);
}
