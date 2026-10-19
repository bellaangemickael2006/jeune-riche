import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getPublishedProducts } from "@/lib/data/products";
import { getTechnicalDetails } from "@/lib/data/product-details";
import { getReviewPhotos } from "@/lib/data/reviewPhotos";
import { getProductModels } from "@/lib/data/productModels";
import { createClient } from "@/lib/supabase/server";
import ProductViewer from "@/components/product/ProductViewer";
import ProductCard from "@/components/catalogue/ProductCard";
import RecentlyViewed from "@/components/product/RecentlyViewed";
import { siteUrl } from "@/lib/utils";
import { getServerTranslation } from "@/lib/i18n/server";
import type { ProductCardData } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Produit introuvable" };
  return {
    title: product.name,
    description: product.description ?? undefined,
    alternates: { canonical: `/catalogue/${product.slug}` },
    openGraph: {
      title: product.name,
      images: product.images[0] ? [product.images[0].url] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const { t } = await getServerTranslation();
  const allProducts = await getPublishedProducts();

  let isLoggedIn = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isLoggedIn = !!user;
  } catch {
    // pas connecté : formulaire d'avis affiche l'invite de connexion
  }

  const models = await getProductModels(product.id);
  const reviewPhotos = await getReviewPhotos(product.reviews.map((r) => r.id));
  const reviews = product.reviews.map((r) => ({ ...r, photos: reviewPhotos[r.id] ?? [] }));

  const images = product.images.map((i) => ({ url: i.url, alt: i.alt, type: i.type, color: i.color }));
  const details = getTechnicalDetails(product.category.slug);

  const otherProducts = allProducts.filter((p) => p.slug !== product.slug);
  const crossSell: ProductCardData[] = otherProducts.slice(0, 4).map((p) => ({
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

  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const canonicalUrl = `${siteUrl()}/catalogue/${product.slug}`;

  // Balisage Product schema.org — permet à Google d'afficher prix, stock et
  // note directement dans les résultats de recherche (rich snippets), sans
  // quoi la fiche apparaît comme une page de contenu générique.
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    // Google exige des URLs absolues pour les images d'un Product schema —
    // celles en base sont relatives (servies depuis /public ou Supabase).
    image: images.map((i) => (i.url.startsWith("http") ? i.url : `${siteUrl()}${i.url}`)),
    sku: product.id,
    category: product.category.name,
    url: canonicalUrl,
    ...(product.price
      ? {
          offers: {
            "@type": "Offer",
            url: canonicalUrl,
            priceCurrency: "XOF",
            price: Number(product.price),
            availability:
              totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          },
        }
      : {}),
    ...(product.reviews.length > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: (
              product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
            ).toFixed(1),
            reviewCount: product.reviews.length,
          },
        }
      : {}),
  };

  return (
    <div className="min-h-screen bg-ink px-5 pb-24 pt-32 md:px-10 md:pt-40">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c") }}
      />
      <ProductViewer
        images={images}
        productId={product.id}
        productName={product.name}
        productSlug={product.slug}
        categoryName={product.category.name}
        description={product.description}
        price={product.price ? Number(product.price) : null}
        variants={product.variants.map((v) => ({
          id: v.id,
          size: v.size,
          color: v.color,
          stock: v.stock,
        }))}
        personalizationEnabled={product.personalizationEnabled}
        personalizationMaxLen={product.personalizationMaxLen}
        sizeGuideRows={product.sizeGuide?.rows}
        details={details}
        reviews={reviews}
        isLoggedIn={isLoggedIn}
        drop={product.drop}
        models={models.map((m) => ({ color: m.color, url: m.url }))}
      />

      {crossSell.length > 0 && (
        <section className="mx-auto mt-32 max-w-6xl border-t border-line pt-16">
          <h2 className="font-editorial text-heading text-paper">{t("product.completeTheLook")}</h2>
          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-14 md:grid-cols-4">
            {crossSell.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      <RecentlyViewed excludeSlug={product.slug} />
    </div>
  );
}
