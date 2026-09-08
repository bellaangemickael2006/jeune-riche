import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getPublishedProducts } from "@/lib/data/products";
import { getTechnicalDetails } from "@/lib/data/product-details";
import { createClient } from "@/lib/supabase/server";
import ProductViewer from "@/components/product/ProductViewer";
import ProductCard from "@/components/catalogue/ProductCard";
import RecentlyViewed from "@/components/product/RecentlyViewed";
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
  }));

  return (
    <div className="min-h-screen bg-ink px-5 pb-24 pt-32 md:px-10 md:pt-40">
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
        reviews={product.reviews}
        isLoggedIn={isLoggedIn}
      />

      {crossSell.length > 0 && (
        <section className="mx-auto mt-32 max-w-6xl border-t border-line pt-16">
          <h2 className="font-editorial text-heading text-paper">Compléter la tenue</h2>
          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-14 md:grid-cols-4">
            {crossSell.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <RecentlyViewed excludeSlug={product.slug} />
    </div>
  );
}
