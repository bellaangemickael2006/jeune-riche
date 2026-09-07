// Historique de consultation produit, uniquement dans le navigateur du
// visiteur — aucune donnée envoyée ni stockée côté serveur. Un instantané
// (nom/image/prix au moment de la visite) est gardé plutôt qu'une simple
// liste de slugs, pour ne pas avoir à refaire une requête juste pour
// afficher la liste.

const STORAGE_KEY = "jeune-riche-recently-viewed";
const MAX_ITEMS = 8;

export type RecentlyViewedItem = {
  slug: string;
  name: string;
  image: string | null;
  price: number | null;
};

export function trackProductView(item: RecentlyViewedItem) {
  if (typeof window === "undefined") return;
  try {
    const existing = getRecentlyViewed();
    const withoutCurrent = existing.filter((i) => i.slug !== item.slug);
    const next = [item, ...withoutCurrent].slice(0, MAX_ITEMS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // stockage indisponible (navigation privée, quota) — pas critique
  }
}

export function getRecentlyViewed(): RecentlyViewedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
