import "server-only";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { MEDIA_BUCKET } from "@/lib/storage";
import { DEFAULT_HOME_CONTENT, parseHomeContent, SITE_MEDIA_PREFIX, type HomeContent } from "@/lib/home/content";

// Réglages de l'accueil enregistrés en JSON dans le stockage Supabase
// (aucune migration de base nécessaire). Lu via le client admin plutôt que
// l'URL publique : le CDN de Supabase garderait sinon une ancienne version
// en cache jusqu'à une heure après chaque modification.
export const HOME_CONTENT_PATH = `${SITE_MEDIA_PREFIX}/home.json`;
export const HOME_CONTENT_TAG = "home-content";

async function readHomeContent(): Promise<HomeContent> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return DEFAULT_HOME_CONTENT;
  try {
    const { data, error } = await createAdminClient().storage.from(MEDIA_BUCKET).download(HOME_CONTENT_PATH);
    // Fichier absent = jamais modifié depuis l'admin : valeurs d'origine.
    if (error || !data) return DEFAULT_HOME_CONTENT;
    return parseHomeContent(JSON.parse(await data.text()));
  } catch (error) {
    console.error("[data] readHomeContent:", error);
    return DEFAULT_HOME_CONTENT;
  }
}

export function getHomeContent() {
  return unstable_cache(readHomeContent, [HOME_CONTENT_TAG], { tags: [HOME_CONTENT_TAG], revalidate: 600 })();
}
