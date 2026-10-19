import "server-only";
import { prisma } from "@/lib/prisma";

export type ProductModelView = { id: string; color: string | null; url: string };

/**
 * Modèles 3D d'un produit. Requête séparée et tolérante : tant que la table
 * product_models n'existe pas encore en production, la fiche s'affiche
 * simplement sans onglet 3D au lieu de tomber.
 */
export async function getProductModels(productId: string): Promise<ProductModelView[]> {
  try {
    return await prisma.productModel.findMany({
      where: { productId },
      orderBy: { createdAt: "asc" },
      select: { id: true, color: true, url: true },
    });
  } catch (error) {
    console.error("[data] getProductModels:", error);
    return [];
  }
}
