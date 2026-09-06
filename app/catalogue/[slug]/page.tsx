import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getPublishedProducts } from "@/lib/data/products";
import { getTechnicalDetails } from "@/lib/data/product-details";
import Gallery from "@/components/product/Gallery";
import AddToCart from "@/components/product/AddToCart";
import SizeGuide from "@/components/product/SizeGuide";
import Reviews from "@/components/product/Reviews";
import WishlistButton from "@/components/product/WishlistButton";
import ProductCard from "@/components/catalogue/ProductCard";
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

  const images = product.images.map((i) => ({ url: i.url, alt: i.alt, type: i.type }));
  const primaryImage = images[0]?.url ?? "";
  const details = getTechnicalDetails(product.category.slug);

  const otherProducts = (await getPublishedProducts()).filter((p) => p.slug !== product.slug);
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
      <div className="grid gap-10 md:grid-cols-2 md:gap-16">
        <Gallery images={images} productName={product.name} />

        <div className="max-w-md">
          <p className="text-xs uppercase tracking-widest2 text-paper/40">{product.category.name}</p>
          <h1 className="mt-2 font-editorial text-3xl text-paper md:text-4xl">
            {product.name}
          </h1>
          {product.description && (
            <p className="mt-4 text-sm leading-relaxed text-paper/60">{product.description}</p>
          )}

          <div className="mt-8">
            <AddToCart
              productSlug={product.slug}
              productName={product.name}
              price={product.price ? Number(product.price) : null}
              image={primaryImage}
              variants={product.variants.map((v) => ({
                id: v.id,
                size: v.size,
                color: v.color,
                stock: v.stock,
              }))}
              personalizationEnabled={product.personalizationEnabled}
              personalizationMaxLen={product.personalizationMaxLen}
            />
          </div>

          <WishlistButton slug={product.slug} className="mt-4" />

          {product.sizeGuide && <SizeGuide rows={product.sizeGuide.rows as never} />}

          <div className="mt-10 border-t border-line pt-6">
            <p className="text-xs uppercase tracking-widest2 text-paper/50">Détails</p>
            <dl className="mt-4 flex flex-col gap-3">
              {details.map((d) => (
                <div key={d.label} className="flex justify-between gap-6 text-sm">
                  <dt className="text-paper/40">{d.label}</dt>
                  <dd className="text-right text-paper/80">{d.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <Reviews reviews={product.reviews} />
        </div>
      </div>

      {crossSell.length > 0 && (
        <section className="mx-auto mt-24 max-w-6xl">
          <h2 className="font-editorial text-2xl text-paper md:text-3xl">Compléter la tenue</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 md:grid-cols-4">
            {crossSell.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
