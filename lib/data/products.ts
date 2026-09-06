import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// Chaque fonction avale ses erreurs de connexion et retourne un résultat vide :
// tant que Supabase n'est pas provisionné (DATABASE_URL absent), les pages
// affichent un état vide au lieu de crasher — voir règle #74 du brief.
//
// Les lectures sont mises en cache (unstable_cache) car Prisma interroge une
// base Supabase distante : sans cache, chaque navigation payait un aller-retour
// réseau complet (observé à 2-5s en dev). Les actions admin invalident le tag
// "products"/"categories" via revalidateTag dès qu'elles écrivent, donc un
// ajout/modif apparaît immédiatement sans attendre l'expiration du cache.

export const getPublishedProducts = unstable_cache(
  async () => {
    try {
      return await prisma.product.findMany({
        where: { published: true, status: "PUBLISHED" },
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          variants: true,
          category: true,
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      console.error("[data] getPublishedProducts:", error);
      return [];
    }
  },
  ["published-products"],
  { tags: ["products"], revalidate: 120 }
);

export const getProductsByCategory = unstable_cache(
  async (categorySlug: string) => {
    try {
      return await prisma.product.findMany({
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
      });
    } catch (error) {
      console.error("[data] getProductsByCategory:", error);
      return [];
    }
  },
  ["products-by-category"],
  { tags: ["products"], revalidate: 120 }
);

export const getProductBySlug = unstable_cache(
  async (slug: string) => {
    try {
      return await prisma.product.findFirst({
        where: { slug, published: true, status: "PUBLISHED" },
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          variants: true,
          category: true,
          sizeGuide: true,
          reviews: { where: { status: "APPROVED" }, include: { user: true } },
        },
      });
    } catch (error) {
      console.error("[data] getProductBySlug:", error);
      return null;
    }
  },
  ["product-by-slug"],
  { tags: ["products"], revalidate: 120 }
);

export const getProductsBySlugs = unstable_cache(
  async (slugs: string[]) => {
    if (slugs.length === 0) return [];
    try {
      return await prisma.product.findMany({
        where: { slug: { in: slugs }, published: true, status: "PUBLISHED" },
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          variants: true,
          category: true,
        },
      });
    } catch (error) {
      console.error("[data] getProductsBySlugs:", error);
      return [];
    }
  },
  ["products-by-slugs"],
  { tags: ["products"], revalidate: 120 }
);

export const getCategories = unstable_cache(
  async () => {
    try {
      return await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
    } catch (error) {
      console.error("[data] getCategories:", error);
      return [];
    }
  },
  ["categories"],
  { tags: ["categories"], revalidate: 300 }
);
