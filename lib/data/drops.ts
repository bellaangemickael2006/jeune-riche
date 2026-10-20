import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

/** Drop et ses pièces publiées, pour la page /drops/[slug]. */
export async function getDropBySlug(slug: string) {
  try {
    return await prisma.drop.findUnique({
      where: { slug },
      include: {
        products: {
          where: { published: true, status: "PUBLISHED" },
          include: { images: { orderBy: { sortOrder: "asc" } }, variants: { select: { stock: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  } catch (error) {
    console.error("[data] getDropBySlug:", error);
    return null;
  }
}

export type DropLiveData = {
  status: string;
  startsAt: string;
  endsAt: string | null;
  /** Stock total restant par pièce. */
  stock: Record<string, number>;
  /** Dernières ventes (2 h) : nom de la pièce et heure, rien de personnel. */
  recentSales: { name: string; at: string }[];
};

/**
 * État « en direct » d'un drop, interrogé toutes les quelques secondes par
 * chaque visiteur de la page. Mis en cache 5 s et partagé : 500 personnes
 * qui regardent le même drop = une requête en base toutes les 5 s, pas 500.
 */
export function getDropLive(slug: string): Promise<DropLiveData | null> {
  return unstable_cache(
    async () => {
      const drop = await prisma.drop.findUnique({
        where: { slug },
        select: {
          id: true,
          status: true,
          startsAt: true,
          endsAt: true,
          products: {
            where: { published: true, status: "PUBLISHED" },
            select: { id: true, variants: { select: { stock: true } } },
          },
        },
      });
      if (!drop) return null;

      const sales = await prisma.orderItem.findMany({
        where: {
          variant: { product: { dropId: drop.id } },
          order: { status: { not: "ANNULEE" }, createdAt: { gte: new Date(Date.now() - 2 * 3600_000) } },
        },
        select: { productName: true, order: { select: { createdAt: true } } },
        orderBy: { order: { createdAt: "desc" } },
        take: 6,
      });

      return {
        status: drop.status,
        startsAt: drop.startsAt.toISOString(),
        endsAt: drop.endsAt?.toISOString() ?? null,
        stock: Object.fromEntries(drop.products.map((p) => [p.id, p.variants.reduce((sum, v) => sum + v.stock, 0)])),
        recentSales: sales.map((s) => ({ name: s.productName, at: s.order.createdAt.toISOString() })),
      };
    },
    ["drop-live", slug],
    { revalidate: 5 }
  )();
}
