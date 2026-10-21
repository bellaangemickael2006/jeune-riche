// Recherche dans le catalogue : partagée par la page /catalogue?q= et les
// suggestions pendant la frappe (/api/search). Sans dépendance (testée).
//
// Insensible aux accents et à la casse (« debardeur » trouve « Débardeur »),
// et chaque mot tapé doit se retrouver quelque part : nom, catégorie ou
// couleur (« polo noir »).

export type SearchableProduct = {
  name: string;
  category: { name: string };
  variants: { color: string }[];
};

export const SEARCH_MAX_LENGTH = 60;

export function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function words(query: string): string[] {
  return normalizeSearch(query.slice(0, SEARCH_MAX_LENGTH)).split(" ").filter(Boolean);
}

/**
 * Score de pertinence d'un produit pour la recherche, 0 = ne correspond pas.
 * Le nom compte plus que la catégorie, la catégorie plus que la couleur ; un
 * nom qui COMMENCE par le mot tapé passe devant.
 */
export function searchScore(product: SearchableProduct, query: string): number {
  const terms = words(query);
  if (terms.length === 0) return 0;
  const name = normalizeSearch(product.name);
  const category = normalizeSearch(product.category.name);
  const colors = normalizeSearch(product.variants.map((v) => v.color).join(" "));
  let score = 0;
  for (const term of terms) {
    if (name.startsWith(term) || name.includes(` ${term}`)) score += 6;
    else if (name.includes(term)) score += 4;
    else if (category.includes(term)) score += 3;
    else if (colors.includes(term)) score += 2;
    else return 0; // chaque mot doit correspondre
  }
  return score;
}

/** Produits correspondants, du plus pertinent au moins pertinent (ordre d'origine en cas d'égalité). */
export function searchProducts<T extends SearchableProduct>(products: T[], query: string, limit?: number): T[] {
  const ranked = products
    .map((product, index) => ({ product, index, score: searchScore(product, query) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((r) => r.product);
  return limit ? ranked.slice(0, limit) : ranked;
}
