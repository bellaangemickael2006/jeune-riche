import { NextResponse } from "next/server";
import { getCategories, getPublishedProducts } from "@/lib/data/products";
import { offlinePages } from "@/lib/offline/pages";

// Liste des pages à garder d'avance pour la lecture hors connexion (voir
// components/providers/OfflineSupport.tsx). Données publiques, déjà en cache.
export async function GET() {
  const [products, categories] = await Promise.all([getPublishedProducts(), getCategories()]);
  const pages = offlinePages({
    productSlugs: products.map((p) => p.slug),
    categorySlugs: categories.map((c) => c.slug),
  });
  return NextResponse.json({ pages }, { headers: { "Cache-Control": "public, max-age=300" } });
}
