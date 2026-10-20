"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdminAction } from "@/lib/auth";
import { logAdmin } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureMediaBucket, MAX_MEDIA_BYTES, MEDIA_BUCKET } from "@/lib/storage";
import { HOME_CONTENT_PATH, HOME_CONTENT_TAG } from "@/lib/data/homeContent";
import { homeContentSchema, SITE_MEDIA_PREFIX, type HomeContent } from "@/lib/home/content";
import { ActionError, runAction, runDataAction, type ActionResult, type DataResult } from "@/lib/actions/result";

const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

// Même principe que les médias produit : le fichier va directement du
// navigateur à Supabase Storage (une server action est limitée à 1 Mo).
export async function prepareSiteImageUpload(file: {
  type: string;
  size: number;
}): Promise<DataResult<{ path: string; token: string; publicUrl: string }>> {
  return runDataAction(async () => {
    await requireAdminAction("accueil");
    const ext = IMAGE_EXT[file.type];
    if (!ext) throw new ActionError("Format non pris en charge : JPEG, PNG, WebP ou AVIF.");
    if (file.size <= 0) throw new ActionError("Fichier vide.");
    if (file.size > MAX_MEDIA_BYTES) throw new ActionError("Image trop lourde (25 Mo max).");

    await ensureMediaBucket();
    const path = `${SITE_MEDIA_PREFIX}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const storage = createAdminClient().storage.from(MEDIA_BUCKET);
    const { data, error } = await storage.createSignedUploadUrl(path);
    if (error || !data) throw new ActionError(`Envoi impossible : ${error?.message ?? "URL non générée"}.`);
    return { path: data.path, token: data.token, publicUrl: storage.getPublicUrl(data.path).data.publicUrl };
  });
}

function referencedPaths(content: HomeContent | null) {
  if (!content) return new Set<string>();
  const urls = [content.hero.url, content.manifeste.url, ...content.lookbook.items.map((i) => i.url)];
  const marker = `/object/public/${MEDIA_BUCKET}/`;
  return new Set(
    urls.filter((u): u is string => Boolean(u)).map((u) => (u.includes(marker) ? u.slice(u.indexOf(marker) + marker.length) : u))
  );
}

/** Best-effort : supprime les images envoyées puis retirées de l'accueil. */
async function removeUnusedSiteImages(content: HomeContent | null) {
  try {
    const keep = referencedPaths(content);
    const storage = createAdminClient().storage.from(MEDIA_BUCKET);
    const { data: files } = await storage.list(SITE_MEDIA_PREFIX, { limit: 1000 });
    const unused = (files ?? [])
      .map((f) => `${SITE_MEDIA_PREFIX}/${f.name}`)
      .filter((p) => p !== HOME_CONTENT_PATH && !keep.has(p));
    if (unused.length > 0) await storage.remove(unused);
  } catch (error) {
    console.error("[admin/accueil] nettoyage images:", error);
  }
}

function refreshHome() {
  updateTag(HOME_CONTENT_TAG);
  revalidatePath("/");
  revalidatePath("/admin/accueil");
}

export async function saveHomeContent(content: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const admin = await requireAdminAction("accueil");
    const parsed = homeContentSchema.safeParse(content);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new ActionError(`Réglage invalide (${issue.path.join(" › ")}) : ${issue.message}`);
    }
    const ids = parsed.data.lookbook.items.map((i) => i.id);
    if (new Set(ids).size !== ids.length) throw new ActionError("Deux photos du lookbook ont le même identifiant.");

    await ensureMediaBucket();
    const body = new Blob([JSON.stringify(parsed.data, null, 2)], { type: "application/json" });
    const { error } = await createAdminClient()
      .storage.from(MEDIA_BUCKET)
      .upload(HOME_CONTENT_PATH, body, { upsert: true, contentType: "application/json", cacheControl: "0" });
    if (error) throw new ActionError(`Enregistrement impossible : ${error.message}.`);

    await removeUnusedSiteImages(parsed.data);
    await logAdmin(admin, "accueil.modification", "Images et textes de la page d'accueil");
    refreshHome();
    return "Page d'accueil mise à jour.";
  });
}

export async function resetHomeContent(): Promise<ActionResult> {
  return runAction(async () => {
    const admin = await requireAdminAction("accueil");
    const { error } = await createAdminClient().storage.from(MEDIA_BUCKET).remove([HOME_CONTENT_PATH]);
    if (error) throw new ActionError(`Réinitialisation impossible : ${error.message}.`);
    await removeUnusedSiteImages(null);
    await logAdmin(admin, "accueil.reinitialisation", "Images d'origine rétablies");
    refreshHome();
    return "Images d'origine rétablies.";
  });
}
