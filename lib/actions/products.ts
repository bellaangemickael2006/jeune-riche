"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, restockEmail } from "@/lib/email";
import {
  ActionError,
  readAmount,
  readInt,
  runAction,
  runDataAction,
  uniqueSlug,
  type ActionResult,
  type DataResult,
} from "@/lib/actions/result";
import type { ImageType } from "@prisma/client";

const MEDIA_BUCKET = "product-media";
const MAX_MEDIA_BYTES = 25 * 1024 * 1024; // 25 Mo, suffisant pour photo/courte vidéo produit
const IMAGE_TYPES: ImageType[] = ["FRONT", "BACK", "DETAIL", "LIFESTYLE", "MOCKUP"];

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

// Extension prise depuis le nom de fichier fourni par le client, jamais fiable
// telle quelle : un nom sans point (ext = le nom entier) ou contenant "/"
// pourrait sinon injecter un segment de chemin dans le path Supabase Storage.
// On ne garde que l'extension si elle correspond à un type réellement permis.
const ALLOWED_IMAGE_EXT = new Set(["jpg", "jpeg", "png", "webp", "avif", "gif"]);
const ALLOWED_VIDEO_EXT = new Set(["mp4", "webm", "mov"]);

function safeExtension(filename: string, allowed: Set<string>, fallback: string) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return allowed.has(ext) ? ext : fallback;
}

function revalidateProduct(productId: string) {
  revalidateTag("products");
  revalidatePath("/admin/produits");
  revalidatePath(`/admin/produits/${productId}`);
  revalidatePath("/catalogue");
}

export async function createProduct(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdmin();

    const name = String(formData.get("name") ?? "").trim();
    const categoryId = String(formData.get("categoryId") ?? "");
    const price = readAmount(formData, "price", "Prix");
    const description = String(formData.get("description") ?? "").trim();
    const personalizationEnabled = formData.get("personalizationEnabled") === "on";

    if (!name || !categoryId) throw new ActionError("Nom et catégorie requis.");

    const slug = await uniqueSlug(name, async (s) => Boolean(await prisma.product.findUnique({ where: { slug: s } })));
    const product = await prisma.product.create({
      data: {
        name,
        slug,
        categoryId,
        price,
        description: description || null,
        personalizationEnabled,
        status: "DRAFT",
        published: false,
      },
    });

    revalidateTag("products");
    revalidatePath("/admin/produits");
    redirect(`/admin/produits/${product.id}`);
  });
}

export async function updateProduct(productId: string, formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdmin();

    const name = String(formData.get("name") ?? "").trim();
    const categoryId = String(formData.get("categoryId") ?? "").trim();
    const price = readAmount(formData, "price", "Prix");
    const description = String(formData.get("description") ?? "").trim();
    const personalizationEnabled = formData.get("personalizationEnabled") === "on";
    const personalizationMaxLen = readInt(formData, "personalizationMaxLen", "Longueur max.") ?? 16;
    const published = formData.get("published") === "on";

    if (!name) throw new ActionError("Le nom du produit ne peut pas être vide.");
    if (personalizationMaxLen < 1 || personalizationMaxLen > 60) {
      throw new ActionError("Longueur max. de personnalisation : entre 1 et 60 caractères.");
    }
    // Un produit publié sans prix apparaît au catalogue mais le checkout le
    // refuse (« plus disponible à la commande ») : on bloque en amont.
    if (published && price === null) {
      throw new ActionError("Renseignez un prix avant de publier ce produit.");
    }

    await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        ...(categoryId ? { categoryId } : {}),
        price,
        description: description || null,
        personalizationEnabled,
        personalizationMaxLen,
        published,
        status: published ? "PUBLISHED" : "DRAFT",
      },
    });

    revalidateProduct(productId);
    return "Produit enregistré.";
  });
}

export async function deleteProduct(productId: string): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdmin();

    const orderCount = await prisma.orderItem.count({ where: { variant: { productId } } });
    if (orderCount > 0) {
      throw new ActionError(
        "Impossible de supprimer : ce produit apparaît dans au moins une commande. Dépubliez-le plutôt que de le supprimer."
      );
    }

    // Les alertes de stock et les paniers ne sont pas supprimés en cascade
    // avec les variantes : on les retire d'abord, sinon la suppression échoue.
    await prisma.$transaction([
      prisma.restockRequest.deleteMany({ where: { variant: { productId } } }),
      prisma.cartItem.deleteMany({ where: { variant: { productId } } }),
      prisma.product.delete({ where: { id: productId } }),
    ]);

    revalidateTag("products");
    revalidatePath("/admin/produits");
    revalidatePath("/catalogue");
    redirect("/admin/produits");
  });
}

export async function addVariant(productId: string, formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdmin();
    const size = String(formData.get("size") ?? "").trim();
    const color = String(formData.get("color") ?? "").trim();
    const stock = readInt(formData, "stock", "Stock") ?? 0;
    if (!size || !color) throw new ActionError("Taille et couleur requises.");

    const existing = await prisma.productVariant.findUnique({
      where: { productId_size_color: { productId, size, color } },
    });
    if (existing) throw new ActionError(`La variante ${color} / ${size} existe déjà pour ce produit.`);

    // L'ancien SKU reprenait les 6 premiers caractères de l'id produit : deux
    // produits créés à quelques secondes d'intervalle partagent ce préfixe
    // (cuid commence par l'horodatage), donc « Noir/M » entrait en collision.
    const base = `${productId.slice(-6)}-${color}-${size}`.toUpperCase().replace(/[^A-Z0-9-]+/g, "");
    let sku = base;
    for (let i = 2; await prisma.productVariant.findUnique({ where: { sku } }); i++) sku = `${base}-${i}`;

    await prisma.productVariant.create({ data: { productId, size, color, stock, sku } });

    revalidateProduct(productId);
    return `Variante ${color} / ${size} ajoutée.`;
  });
}

export async function updateVariantStock(variantId: string, productId: string, formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdmin();
    const stock = readInt(formData, "stock", "Stock");
    if (stock === null) throw new ActionError("Indiquez un stock (0 ou plus).");

    const previous = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { stock: true },
    });
    await prisma.productVariant.update({ where: { id: variantId }, data: { stock } });

    // "Nous vous préviendrons dès le retour en stock" (voir NotifyMe dans
    // AddToCart.tsx) : envoyé quand une variante en rupture est réapprovisionnée.
    let notified = 0;
    if (previous && previous.stock <= 0 && stock > 0) {
      const pending = await prisma.restockRequest.findMany({
        where: { variantId, notified: false },
        include: { variant: { include: { product: true } } },
      });
      for (const request of pending) {
        const result = await sendEmail({
          to: request.email,
          subject: `De retour en stock — JEUNE RICHE`,
          html: restockEmail({
            productName: request.variant.product.name,
            size: request.variant.size,
            color: request.variant.color,
            productSlug: request.variant.product.slug,
          }),
        });
        if (result.sent) notified++;
      }
      if (pending.length > 0) {
        await prisma.restockRequest.updateMany({
          where: { id: { in: pending.map((p) => p.id) } },
          data: { notified: true },
        });
      }
    }

    revalidateProduct(productId);
    return notified > 0 ? `Stock mis à jour — ${notified} client(s) prévenu(s).` : "Stock mis à jour.";
  });
}

export async function deleteVariant(variantId: string, productId: string): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdmin();
    const used = await prisma.orderItem.count({ where: { variantId } });
    if (used > 0) {
      throw new ActionError("Impossible de retirer cette variante : elle figure dans une commande. Mettez son stock à 0.");
    }
    await prisma.$transaction([
      prisma.restockRequest.deleteMany({ where: { variantId } }),
      prisma.cartItem.deleteMany({ where: { variantId } }),
      prisma.productVariant.delete({ where: { id: variantId } }),
    ]);
    revalidateProduct(productId);
  });
}

// Le fichier ne transite plus par le serveur : une server action est limitée
// à 1 Mo par défaut (et Vercel coupe toute requête au-delà de 4,5 Mo), donc
// une photo produit normale échouait. Le serveur délivre une URL d'envoi
// signée, à usage unique ; le navigateur envoie le fichier directement à
// Supabase Storage, puis l'action d'enregistrement ci-dessous le rattache.
export async function prepareMediaUpload(
  productId: string,
  kind: "image" | "video",
  file: { name: string; type: string; size: number }
): Promise<DataResult<{ path: string; token: string }>> {
  return runDataAction(async () => {
    await requireAdmin();
    if (kind === "image" && !file.type.startsWith("image/")) {
      throw new ActionError("Le fichier sélectionné n'est pas une image.");
    }
    if (kind === "video" && !file.type.startsWith("video/")) {
      throw new ActionError("Le fichier sélectionné n'est pas une vidéo.");
    }
    if (file.size <= 0) throw new ActionError("Fichier vide.");
    if (file.size > MAX_MEDIA_BYTES) throw new ActionError("Fichier trop volumineux (25 Mo max).");
    if (!(await prisma.product.findUnique({ where: { id: productId }, select: { id: true } }))) {
      throw new ActionError("Produit introuvable.");
    }

    await ensureMediaBucket();
    const ext =
      kind === "image"
        ? safeExtension(file.name, ALLOWED_IMAGE_EXT, "jpg")
        : safeExtension(file.name, ALLOWED_VIDEO_EXT, "mp4");
    const prefix = kind === "video" ? "video-" : "";
    const path = `${productId}/${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { data, error } = await createAdminClient().storage.from(MEDIA_BUCKET).createSignedUploadUrl(path);
    if (error || !data) throw new ActionError(`Envoi impossible : ${error?.message ?? "URL non générée"}.`);
    return { path: data.path, token: data.token };
  });
}

/** Chemin de stockage produit par prepareMediaUpload pour ce produit, jamais un autre. */
function checkUploadedPath(productId: string, path: string, kind: "image" | "video") {
  const allowed = kind === "image" ? ALLOWED_IMAGE_EXT : ALLOWED_VIDEO_EXT;
  const prefix = kind === "video" ? "video-" : "";
  const match = new RegExp(`^${productId}/${prefix}\\d+-[a-z0-9]+\\.([a-z0-9]+)$`).exec(path);
  if (!match || !allowed.has(match[1])) throw new ActionError("Fichier envoyé invalide. Recommencez l'envoi.");
}

function storagePathFromUrl(url: string) {
  const marker = `/object/public/${MEDIA_BUCKET}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : url.slice(index + marker.length);
}

export async function addProductImage(productId: string, formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdmin();
    const path = String(formData.get("path") ?? "");
    const alt = String(formData.get("alt") ?? "").trim();
    const color = String(formData.get("color") ?? "").trim();
    const typeRaw = String(formData.get("type") ?? "MOCKUP") as ImageType;
    const type = IMAGE_TYPES.includes(typeRaw) ? typeRaw : "MOCKUP";
    checkUploadedPath(productId, path, "image");

    const { data } = createAdminClient().storage.from(MEDIA_BUCKET).getPublicUrl(path);
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

    revalidateProduct(productId);
    return "Image ajoutée.";
  });
}

export async function deleteProductImage(imageId: string, productId: string): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdmin();
    const image = await prisma.productImage.delete({ where: { id: imageId } });

    // Supprimer l'image principale laissait le produit sans visuel principal
    // (vignette vide au catalogue) : la suivante dans l'ordre prend le relais.
    if (image.isPrimary) {
      const next = await prisma.productImage.findFirst({ where: { productId }, orderBy: { sortOrder: "asc" } });
      if (next) await prisma.productImage.update({ where: { id: next.id }, data: { isPrimary: true } });
    }

    await removeStoredFile(image.url);
    revalidateProduct(productId);
  });
}

// Best-effort : un fichier orphelin ne casse rien, il occupe juste de la place.
async function removeStoredFile(url: string | null) {
  const path = url ? storagePathFromUrl(url) : null;
  if (!path) return;
  try {
    await createAdminClient().storage.from(MEDIA_BUCKET).remove([path]);
  } catch (error) {
    console.error("[admin] suppression fichier média:", error);
  }
}

export async function setProductVideo(productId: string, formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdmin();
    const path = String(formData.get("path") ?? "");
    checkUploadedPath(productId, path, "video");

    const previous = await prisma.product.findUnique({ where: { id: productId }, select: { videoUrl: true } });
    const { data } = createAdminClient().storage.from(MEDIA_BUCKET).getPublicUrl(path);
    await prisma.product.update({ where: { id: productId }, data: { videoUrl: data.publicUrl } });
    await removeStoredFile(previous?.videoUrl ?? null);

    revalidateProduct(productId);
    return "Vidéo enregistrée.";
  });
}

export async function removeProductVideo(productId: string): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdmin();
    const previous = await prisma.product.findUnique({ where: { id: productId }, select: { videoUrl: true } });
    await prisma.product.update({ where: { id: productId }, data: { videoUrl: null } });
    await removeStoredFile(previous?.videoUrl ?? null);
    revalidateProduct(productId);
  });
}
