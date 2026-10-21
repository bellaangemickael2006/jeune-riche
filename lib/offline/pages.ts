// Pages gardées d'avance sur le téléphone pour la lecture hors connexion
// (service worker public/sw.js, message « warm »). Uniquement des pages
// publiques, les mêmes pour tout le monde. Sans dépendance (testée).

export const OFFLINE_STATIC_PAGES = ["/", "/catalogue", "/drops", "/manifeste", "/atelier", "/a-propos", "/contact"];
export const OFFLINE_MAX_PRODUCTS = 30;

export function offlinePages(params: { productSlugs: string[]; categorySlugs: string[] }): string[] {
  const enc = encodeURIComponent;
  return [
    ...OFFLINE_STATIC_PAGES,
    ...params.categorySlugs.map((slug) => `/catalogue?categorie=${enc(slug)}`),
    ...params.productSlugs.slice(0, OFFLINE_MAX_PRODUCTS).map((slug) => `/catalogue/${enc(slug)}`),
  ];
}
