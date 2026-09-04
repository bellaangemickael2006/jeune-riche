import { prisma } from "@/lib/prisma";

// Chaque fonction avale ses erreurs de connexion et retourne un résultat vide :
// tant que Supabase n'est pas provisionné (DATABASE_URL absent), les pages
// affichent un état vide au lieu de crasher — voir règle #74 du brief.

export async function getPublishedProducts() {
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
}

export async function getProductsByCategory(categorySlug: string) {
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
}

export async function getProductBySlug(slug: string) {
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
}

export async function getProductsBySlugs(slugs: string[]) {
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
}

export async function getCategories() {
  try {
    return await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  } catch (error) {
    console.error("[data] getCategories:", error);
    return [];
  }
}
