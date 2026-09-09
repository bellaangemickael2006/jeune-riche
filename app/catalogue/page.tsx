import type { Metadata } from "next";
import Link from "next/link";
import { getCategories, getProductsByCategory, getPublishedProducts } from "@/lib/data/products";
import ProductCard from "@/components/catalogue/ProductCard";
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
    <div className="mx-auto min-h-screen max-w-[1600px] bg-ink px-5 pb-24 pt-32 md:px-10 md:pt-40">
      <div className="mb-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-label text-paper/40">{t("catalogue.eyebrow")}</p>
          <h1 className="mt-3 font-editorial text-heading-lg text-paper md:text-[4.5rem] md:leading-[0.98]">
            {t("catalogue.title")}
          </h1>
        </div>
        <CategoryFilters categories={displayCategories} active={activeCategory} allLabel={t("catalogue.all")} />
      </div>

      <div className="mb-12 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line pt-4">
        <p className="text-caption text-paper/40">{t("catalogue.pieceCount", { count: cardData.length })}</p>
        <div className="flex flex-wrap items-center gap-4">
          <span className="hidden text-caption text-paper/30 sm:inline">{t("catalogue.sort")}</span>
          {SORTS.map((sort) => (
            <Link
              key={sort.value}
              href={sortHref(sort.value)}
              className={cn(
                "text-caption transition-colors",
                activeSort === sort.value ? "text-paper underline underline-offset-4" : "text-paper/40 hover:text-paper/70"
              )}
            >
              {sort.label}
            </Link>
          ))}
        </div>
      </div>

      {cardData.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 border border-line py-24 text-center">
          <p className="text-body text-paper/60">{t("catalogue.empty")}</p>
          <p className="text-caption text-paper/30">{t("catalogue.emptyHint")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-16 sm:grid-cols-2 md:grid-cols-3 md:gap-x-8 xl:grid-cols-4">
          {cardData.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
