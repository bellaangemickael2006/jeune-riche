import type { Metadata } from "next";
import { getCategories, getProductsByCategory, getPublishedProducts } from "@/lib/data/products";
import ProductCard from "@/components/catalogue/ProductCard";
import CategoryFilters from "@/components/catalogue/CategoryFilters";
import type { ProductCardData } from "@/types";

export const metadata: Metadata = {
  title: "Catalogue",
  description: "Le catalogue JEUNE RICHE — t-shirt, polo, chemise, débardeur, jogger, casquette.",
};

const FALLBACK_CATEGORIES = [
  { slug: "t-shirt", name: "T-shirt" },
  { slug: "polo", name: "Polo" },
  { slug: "chemise", name: "Chemise" },
  { slug: "debardeur", name: "Débardeur" },
  { slug: "jogger", name: "Jogger" },
  { slug: "casquette", name: "Casquette" },
];

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string; q?: string }>;
}) {
  const params = await searchParams;
  const categories = await getCategories();
  const activeCategory = params.categorie;

  const products = activeCategory
    ? await getProductsByCategory(activeCategory)
    : await getPublishedProducts();

  const filtered = params.q
    ? products.filter((p) => p.name.toLowerCase().includes(params.q!.toLowerCase()))
    : products;

  const cardData: ProductCardData[] = filtered.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price ? Number(p.price) : null,
    personalizationEnabled: p.personalizationEnabled,
    images: p.images.map((i) => ({ url: i.url, alt: i.alt, type: i.type })),
    category: { name: p.category.name, slug: p.category.slug },
    variants: p.variants.map((v) => ({ id: v.id, color: v.color, size: v.size, stock: v.stock })),
  }));

  const displayCategories = categories.length > 0 ? categories : FALLBACK_CATEGORIES;

  return (
    <div className="min-h-screen bg-ink px-5 pb-24 pt-32 md:px-10 md:pt-40">
      <div className="mb-12 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest2 text-paper/40">Catalogue</p>
          <h1 className="mt-2 font-display text-4xl uppercase text-paper md:text-6xl">
            Toute la collection
          </h1>
        </div>
        <CategoryFilters categories={displayCategories} active={activeCategory} />
      </div>

      {cardData.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 border border-line py-24 text-center">
          <p className="text-paper/60">Aucun produit disponible pour le moment.</p>
          <p className="text-xs text-paper/30">
            Les produits publiés depuis l&apos;administration apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 md:gap-x-6">
          {cardData.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
