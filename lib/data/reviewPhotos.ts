import "server-only";
import { prisma } from "@/lib/prisma";

export type ReviewPhotoView = { url: string };

/**
 * Photos des avis, indexées par avis. Requête séparée et tolérante : tant que
 * la table review_photos n'existe pas encore en production (migration pas
 * appliquée), les avis s'affichent simplement sans photo au lieu de faire
 * tomber la fiche produit ou la page de modération.
 */
export async function getReviewPhotos(reviewIds: string[]): Promise<Record<string, ReviewPhotoView[]>> {
  if (reviewIds.length === 0) return {};
  try {
    const photos = await prisma.reviewPhoto.findMany({
      where: { reviewId: { in: reviewIds } },
      orderBy: { sortOrder: "asc" },
      select: { reviewId: true, url: true },
    });
    const byReview: Record<string, ReviewPhotoView[]> = {};
    for (const p of photos) (byReview[p.reviewId] ??= []).push({ url: p.url });
    return byReview;
  } catch (error) {
    console.error("[data] getReviewPhotos:", error);
    return {};
  }
}
