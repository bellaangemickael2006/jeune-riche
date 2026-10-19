import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Bucket public unique pour les médias du site : photos/vidéos produit (un
// dossier par produit) et photos d'avis clients (dossier reviews/).
export const MEDIA_BUCKET = "product-media";
export const MAX_MEDIA_BYTES = 25 * 1024 * 1024; // 25 Mo, suffisant pour photo/courte vidéo produit
export const REVIEW_PHOTOS_PREFIX = "reviews";

let bucketEnsured = false;

export async function ensureMediaBucket() {
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

/** Best-effort : un fichier orphelin ne casse rien, il occupe juste de la place. */
export async function removeMediaFiles(paths: string[]) {
  if (paths.length === 0) return;
  try {
    await createAdminClient().storage.from(MEDIA_BUCKET).remove(paths);
  } catch (error) {
    console.error("[storage] suppression fichiers:", error);
  }
}
