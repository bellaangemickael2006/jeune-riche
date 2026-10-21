"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminAction } from "@/lib/auth";
import { logAdmin } from "@/lib/admin/audit";
import { createClient } from "@/lib/supabase/server";
import { getServerTranslation } from "@/lib/i18n/server";
import { randomUUID } from "node:crypto";
import { ActionError, runAction, type ActionResult } from "@/lib/actions/result";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureMediaBucket, MEDIA_BUCKET, removeMediaFiles, REVIEW_PHOTOS_PREFIX } from "@/lib/storage";
import { rateLimit } from "@/lib/rateLimit";
import { MAX_REVIEW_LENGTH, MAX_REVIEW_PHOTOS } from "@/lib/reviewPhotosConfig";

const MAX_REVIEW_PHOTO_BYTES = 8 * 1024 * 1024; // le navigateur réduit déjà la photo avant l'envoi
const REVIEW_PHOTO_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

async function currentDbUser() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;
  return prisma.user.findUnique({ where: { supabaseId: authUser.id } });
}

/** Chemin propre à ce client : impossible de rattacher la photo d'un autre. */
function reviewPhotoPattern(userId: string) {
  return new RegExp(`^${REVIEW_PHOTOS_PREFIX}/${userId}-[0-9a-f-]{36}\\.(jpg|png|webp)$`);
}

export type PrepareReviewPhotoResult = { ok: true; path: string; token: string } | { ok: false; message: string };

// Même principe que les médias produit : URL d'envoi signée, le fichier va
// directement du navigateur à Supabase Storage sans passer par le serveur.
export async function prepareReviewPhotoUpload(file: { type: string; size: number }): Promise<PrepareReviewPhotoResult> {
  const { t } = await getServerTranslation();
  try {
    const dbUser = await currentDbUser();
    if (!dbUser) return { ok: false, message: t("product.reviewLoginRequired") };
    const ext = REVIEW_PHOTO_TYPES[file.type];
    if (!ext || file.size <= 0 || file.size > MAX_REVIEW_PHOTO_BYTES) {
      return { ok: false, message: t("product.reviewPhotoInvalid") };
    }
    if (!(await rateLimit(`review-photo:${dbUser.id}`, 12, 60 * 60_000))) {
      return { ok: false, message: t("product.reviewPhotoTooMany") };
    }

    await ensureMediaBucket();
    const path = `${REVIEW_PHOTOS_PREFIX}/${dbUser.id}-${randomUUID()}.${ext}`;
    const { data, error } = await createAdminClient().storage.from(MEDIA_BUCKET).createSignedUploadUrl(path);
    if (error || !data) throw error ?? new Error("URL non générée");
    return { ok: true, path: data.path, token: data.token };
  } catch (error) {
    console.error("[avis] prepareReviewPhotoUpload:", error);
    return { ok: false, message: t("product.reviewPhotoUploadError") };
  }
}

/** Ne garde que les photos réellement envoyées par ce client dans le stockage. */
async function verifiedPhotoPaths(userId: string, raw: FormDataEntryValue[]) {
  const pattern = reviewPhotoPattern(userId);
  const paths = Array.from(new Set(raw.map(String))).filter((p) => pattern.test(p)).slice(0, MAX_REVIEW_PHOTOS);
  if (paths.length === 0) return [];
  const { data } = await createAdminClient()
    .storage.from(MEDIA_BUCKET)
    .list(REVIEW_PHOTOS_PREFIX, { search: `${userId}-`, limit: 100 });
  const stored = new Set((data ?? []).map((f) => `${REVIEW_PHOTOS_PREFIX}/${f.name}`));
  return paths.filter((p) => stored.has(p));
}

export async function moderateReview(reviewId: string, status: "APPROVED" | "REJECTED"): Promise<ActionResult> {
  return runAction(async () => {
    const admin = await requireAdminAction("avis");
    if (status !== "APPROVED" && status !== "REJECTED") throw new ActionError("Statut inconnu.");
    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { status },
      include: { product: { select: { slug: true, name: true } } },
    });
    await logAdmin(admin, "avis.moderation", `Avis sur « ${review.product.name} » ${status === "APPROVED" ? "approuvé" : "refusé"}`, reviewId);
    revalidatePath("/admin/avis");
    // Un avis approuvé doit apparaître sur la fiche produit sans attendre.
    revalidatePath(`/catalogue/${review.product.slug}`);
  });
}

export async function deleteReview(reviewId: string): Promise<ActionResult> {
  return runAction(async () => {
    const admin = await requireAdminAction("avis");
    let photoPaths: string[] = [];
    try {
      photoPaths = (await prisma.reviewPhoto.findMany({ where: { reviewId }, select: { path: true } })).map((p) => p.path);
    } catch {
      // table pas encore migrée : aucune photo à supprimer
    }
    const review = await prisma.review.delete({
      where: { id: reviewId },
      include: { product: { select: { slug: true, name: true } } },
    });
    await removeMediaFiles(photoPaths);
    await logAdmin(admin, "avis.suppression", `Avis ${review.rating}/5 sur « ${review.product.name} »`, reviewId);
    revalidatePath("/admin/avis");
    revalidatePath(`/catalogue/${review.product.slug}`);
  });
}

export type CreateReviewState = { ok: boolean; message: string } | null;

// verifiedOrder n'est jamais fourni par le client : recalculé côté serveur à
// partir des commandes livrées réellement liées à ce produit, sinon
// n'importe qui pourrait s'auto-attribuer le badge "client vérifié".
export async function createReview(
  productId: string,
  // Gardé pour la signature du formulaire ; jamais utilisé : le slug est
  // relu en base (un argument lié reste modifiable par le navigateur).
  _productSlug: string,
  _prevState: CreateReviewState,
  formData: FormData
): Promise<CreateReviewState> {
  const { t } = await getServerTranslation();
  const dbUser = await currentDbUser();
  if (!dbUser) {
    return { ok: false, message: t("product.reviewLoginRequired") };
  }

  const rating = Number(formData.get("rating"));
  const comment = String(formData.get("comment") ?? "").trim().slice(0, MAX_REVIEW_LENGTH);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, message: t("product.reviewInvalidRating") };
  }
  if (comment.length < 5) {
    return { ok: false, message: t("product.reviewTooShort") };
  }

  // Uniquement sur un produit en vente : l'identifiant vient du navigateur.
  const product = await prisma.product.findFirst({
    where: { id: String(productId), published: true, status: "PUBLISHED" },
    select: { slug: true },
  });
  if (!product) return { ok: false, message: t("errors.generic.title") };

  const existing = await prisma.review.findFirst({
    where: { productId, userId: dbUser.id },
  });
  if (existing) {
    return { ok: false, message: t("product.reviewAlreadyExists") };
  }

  const verifiedOrder = Boolean(
    await prisma.orderItem.findFirst({
      where: { order: { userId: dbUser.id, status: "LIVREE" }, variant: { productId } },
    })
  );

  const review = await prisma.review.create({
    data: { productId, userId: dbUser.id, rating, comment, verifiedOrder },
  });

  // Après l'avis, et sans jamais le faire échouer : une photo perdue vaut
  // mieux qu'un avis perdu.
  let photosSaved = true;
  try {
    const paths = await verifiedPhotoPaths(dbUser.id, formData.getAll("photos"));
    if (paths.length > 0) {
      const storage = createAdminClient().storage.from(MEDIA_BUCKET);
      await prisma.reviewPhoto.createMany({
        data: paths.map((path, i) => ({
          reviewId: review.id,
          path,
          url: storage.getPublicUrl(path).data.publicUrl,
          sortOrder: i,
        })),
      });
    }
  } catch (error) {
    console.error("[avis] photos:", error);
    photosSaved = false;
  }

  revalidatePath(`/catalogue/${product.slug}`);
  revalidatePath("/admin/avis");
  return {
    ok: true,
    message: photosSaved ? t("product.reviewSuccess") : `${t("product.reviewSuccess")} ${t("product.reviewPhotoNotSaved")}`,
  };
}
