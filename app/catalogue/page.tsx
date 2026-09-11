import type { Metadata } from "next";
import Link from "next/link";
import { getCategories, getProductsByCategory, getPublishedProducts } from "@/lib/data/products";
import ProductRow from "@/components/catalogue/ProductRow";
import CategoryFilters from "@/components/catalogue/CategoryFilters";
import { cn } from "@/lib/utils";
import { getServerTranslation } from "@/lib/i18n/server";
import type { ProductCardData } from "@/types";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslation();
  return {
    title: t("catalogue.eyebrow"),
    description: t("catalogue.title"),
    // Les filtres/tri (?categorie=, ?tri=, ?q=) ne doivent pas créer autant de
    // pages distinctes aux yeux de Google que de combinaisons possibles — tout
    // pointe vers la même page canonique.
    alternates: { canonical: "/catalogue" },
  };
}

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
  searchParams: Promise<{ categorie?: string; q?: string; tri?: string }>;
}) {
  const { t } = await getServerTranslation();
  const params = await searchParams;
  const activeCategory = params.categorie;
  const activeSort = params.tri ?? "";

  const SORTS = [
    { value: "", label: t("catalogue.sortRecent") },
    { value: "prix-asc", label: t("catalogue.sortPriceAsc") },
    { value: "prix-desc", label: t("catalogue.sortPriceDesc") },
  ] as const;

  const categories = await getCategories();
  const products = activeCategory
    ? await getProductsByCategory(activeCategory)
    : await getPublishedProducts();

  const filtered = params.q
    ? products.filter((p) => p.name.toLowerCase().includes(params.q!.toLowerCase()))
    : products;

  const sorted = [...filtered].sort((a, b) => {
    if (activeSort === "prix-asc") return Number(a.price ?? 0) - Number(b.price ?? 0);
    if (activeSort === "prix-desc") return Number(b.price ?? 0) - Number(a.price ?? 0);
    return 0;
  });

  const cardData: ProductCardData[] = sorted.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price ? Number(p.price) : null,
    personalizationEnabled: p.personalizationEnabled,
    images: p.images.map((i) => ({ url: i.url, alt: i.alt, type: i.type })),
    category: { name: p.category.name, slug: p.category.slug },
    variants: p.variants.map((v) => ({ id: v.id, color: v.color, size: v.size, stock: v.stock })),
    drop: p.drop,
  }));

  const displayCategories = categories.length > 0 ? categories : FALLBACK_CATEGORIES;

  function sortHref(value: string) {
    const qs = new URLSearchParams();
    if (activeCategory) qs.set("categorie", activeCategory);
    if (params.q) qs.set("q", params.q);
    if (value) qs.set("tri", value);
    const s = qs.toString();
    return s ? `/catalogue?${s}` : "/catalogue";
  }

  return (
    <div className="mx-auto min-h-screen max-w-[1400px] bg-ink px-5 pb-24 pt-28 md:px-10 md:pt-36">
      {/* Ouverture de page : filet, rubrique, compte réel des pièces. Le
          titre éditorial descend ensuite seul, sans concurrence visuelle. */}
      <div className="flex items-baseline justify-between gap-6 border-t border-line pt-4">
        <span className="text-label text-paper/30">{t("catalogue.eyebrow")}</span>
        <span className="text-label text-paper/30">
          {t("catalogue.pieceCount", { count: cardData.length })}
        </span>
      </div>
      <h1 className="mt-6 max-w-4xl font-editorial text-heading-lg leading-[0.98] text-paper md:mt-8 md:text-[4.5rem]">
        {t("catalogue.title")}
      </h1>

      {/* Filtres et tri sur une même ligne de contrôle, séparés par un filet
          du contenu qu'ils gouvernent. */}
      <div className="mb-4 mt-12 flex flex-col gap-5 border-b border-line pb-4 md:mt-16 md:flex-row md:items-baseline md:justify-between md:gap-10">
        <CategoryFilters categories={displayCategories} active={activeCategory} allLabel={t("catalogue.all")} />
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <span className="text-label hidden text-paper/25 sm:inline">{t("catalogue.sort")}</span>
          {SORTS.map((sort) => (
            <Link
              key={sort.value}
              href={sortHref(sort.value)}
              className={cn(
                "text-label relative pb-2 transition-colors",
                activeSort === sort.value ? "text-paper" : "text-paper/40 hover:text-paper/80"
              )}
            >
              {sort.label}
              {activeSort === sort.value && (
                <span className="absolute inset-x-0 bottom-0 h-px bg-paper" />
              )}
            </Link>
          ))}
        </div>
      </div>

      {cardData.length === 0 ? (
        <div className="border-t border-line pb-20 pt-12">
          <p className="max-w-md font-editorial text-heading leading-tight text-paper/70">
            {t("catalogue.empty")}
          </p>
          <p className="text-body mt-4 text-paper/35">{t("catalogue.emptyHint")}</p>
        </div>
      ) : (
        // Une pièce par ligne plutôt qu'une grille de quatre colonnes : six
        // pièces réparties sur quatre colonnes laissaient une grille aux
        // trois quarts vide. Voir components/catalogue/ProductRow.tsx.
        <div>
          {cardData.map((product, i) => (
            <ProductRow key={product.id} product={product} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
