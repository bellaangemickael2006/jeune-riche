import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Bucket public unique pour les médias du site : photos/vidéos produit (un
// dossier par produit) et photos d'avis clients (dossier reviews/).
export const MEDIA_BUCKET = "product-media";
export const MAX_MEDIA_BYTES = 25 * 1024 * 1024; // 25 Mo, suffisant pour photo/courte vidéo produit
export const REVIEW_PHOTOS_PREFIX = "reviews";

/**
 * Seuls types acceptés par le bucket. Les envois passent par des URL
 * signées où c'est le NAVIGATEUR qui annonce le type du fichier : sans cette
 * liste, un client pouvait déposer, à la place d'une photo d'avis, une page
 * HTML ou un SVG avec script, servis ensuite depuis l'adresse publique du
 * stockage (hameçonnage). Aucun type « image/* » générique : il inclurait le
 * SVG.
 */
export const ALLOWED_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "model/gltf-binary", // modèles 3D .glb
  "application/json", // réglages de la page d'accueil (écrits par le serveur)
];

let bucketEnsured = false;

/**
 * Crée le bucket s'il manque et (ré)applique ses règles à chaque démarrage
 * d'instance : un bucket créé avant l'arrivée de ces règles les reçoit aussi.
 */
export async function ensureMediaBucket() {
  if (bucketEnsured) return;
  const supabase = createAdminClient();
  const rules = { public: true, fileSizeLimit: MAX_MEDIA_BYTES, allowedMimeTypes: ALLOWED_MEDIA_TYPES };
  const { data: buckets } = await supabase.storage.listBuckets();
  const { error } = buckets?.some((b) => b.name === MEDIA_BUCKET)
    ? await supabase.storage.updateBucket(MEDIA_BUCKET, rules)
    : await supabase.storage.createBucket(MEDIA_BUCKET, rules);
  if (error) throw new Error(`Bucket ${MEDIA_BUCKET} : ${error.message}`);
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
