import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// Chaque fonction avale ses erreurs de connexion et retourne un résultat vide :
// tant que Supabase n'est pas provisionné (DATABASE_URL absent), les pages
// affichent un état vide au lieu de crasher — voir règle #74 du brief.
//
// Historique du cache (07/09) : une première version enveloppait la fonction
// une seule fois au niveau module avec unstable_cache(fn, ["product-by-slug"]),
// en comptant sur Next.js pour dériver automatiquement le reste de la clé à
// partir de l'argument passé à chaque appel. En production (Vercel), ça a
// produit des réponses erronées pour plusieurs produits (slug ignoré par la
// clé de cache) alors que la requête Prisma brute a toujours répondu
// correctement en test direct — cause exacte non confirmée côté Next.js,
// donc pas question de refaire une confiance aveugle au même mécanisme.
// Le cache a été retiré le temps de stabiliser le site, puis réintroduit
// ci-dessous avec la clé construite explicitement à partir de l'argument
// réel (voir cachedBySlug/cachedByCategory/cachedBySlugs) — chaque appel
// crée son propre unstable_cache dont la clé contient littéralement la
// valeur de l'argument, donc aucune dérivation implicite à faire confiance.

export async function getPublishedProducts() {
  try {
    return await unstable_cache(
      () =>
        prisma.product.findMany({
          where: { published: true, status: "PUBLISHED" },
          include: {
            images: { orderBy: { sortOrder: "asc" } },
            variants: true,
            category: true,
          },
          orderBy: { createdAt: "desc" },
        }),
      ["published-products"],
      { tags: ["products"], revalidate: 120 }
    )();
  } catch (error) {
    console.error("[data] getPublishedProducts:", error);
    return [];
  }
}

export async function getProductsByCategory(categorySlug: string) {
  try {
    return await unstable_cache(
      () =>
        prisma.product.findMany({
          where: {
            published: true,
            status: "PUBLISHED",
            category: { slug: categorySlug },
          },
          include: {
            images: { orderBy: { sortOrder: "asc" } },
            variants: true,
            category: true,
          },
          orderBy: { createdAt: "desc" },
        }),
      // La valeur réelle de categorySlug fait partie de la clé, pas
      // seulement un libellé statique — c'est ce qui manquait avant.
      ["products-by-category", categorySlug],
      { tags: ["products"], revalidate: 120 }
    )();
  } catch (error) {
    console.error("[data] getProductsByCategory:", error);
    return [];
  }
}

export async function getProductBySlug(slug: string) {
  try {
    return await unstable_cache(
      () =>
        prisma.product.findFirst({
          where: { slug, published: true, status: "PUBLISHED" },
          include: {
            images: { orderBy: { sortOrder: "asc" } },
            variants: true,
            category: true,
            sizeGuide: true,
            reviews: { where: { status: "APPROVED" }, include: { user: true } },
          },
        }),
      ["product-by-slug", slug],
      { tags: ["products"], revalidate: 120 }
    )();
  } catch (error) {
    console.error("[data] getProductBySlug:", error);
    return null;
  }
}

export async function getProductsBySlugs(slugs: string[]) {
  if (slugs.length === 0) return [];
  try {
    const sorted = [...slugs].sort();
    return await unstable_cache(
      () =>
        prisma.product.findMany({
          where: { slug: { in: sorted }, published: true, status: "PUBLISHED" },
          include: {
            images: { orderBy: { sortOrder: "asc" } },
            variants: true,
            category: true,
          },
        }),
      ["products-by-slugs", sorted.join(",")],
      { tags: ["products"], revalidate: 120 }
    )();
  } catch (error) {
    console.error("[data] getProductsBySlugs:", error);
    return [];
  }
}

export async function getCategories() {
  try {
    return await unstable_cache(
      () => prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
      ["categories"],
      { tags: ["categories"], revalidate: 300 }
    )();
  } catch (error) {
    console.error("[data] getCategories:", error);
    return [];
  }
}
