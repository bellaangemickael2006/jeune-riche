"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getServerTranslation } from "@/lib/i18n/server";

export async function moderateReview(reviewId: string, status: "APPROVED" | "REJECTED") {
  await requireAdmin();
  await prisma.review.update({ where: { id: reviewId }, data: { status } });
  revalidatePath("/admin/avis");
}

export type CreateReviewState = { ok: boolean; message: string } | null;

// verifiedOrder n'est jamais fourni par le client : recalculé côté serveur à
// partir des commandes livrées réellement liées à ce produit, sinon
// n'importe qui pourrait s'auto-attribuer le badge "client vérifié".
export async function createReview(
  productId: string,
  productSlug: string,
  _prevState: CreateReviewState,
  formData: FormData
): Promise<CreateReviewState> {
  const { t } = await getServerTranslation();
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return { ok: false, message: t("product.reviewLoginRequired") };
  }

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
  if (!dbUser) {
    return { ok: false, message: t("product.reviewLoginRequired") };
  }

  const rating = Number(formData.get("rating"));
  const comment = String(formData.get("comment") ?? "").trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, message: t("product.reviewInvalidRating") };
  }
  if (comment.length < 5) {
    return { ok: false, message: t("product.reviewTooShort") };
  }

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

  await prisma.review.create({
    data: { productId, userId: dbUser.id, rating, comment, verifiedOrder },
  });

  revalidatePath(`/catalogue/${productSlug}`);
  return { ok: true, message: t("product.reviewSuccess") };
}
