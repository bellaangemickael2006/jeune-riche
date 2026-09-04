import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/data/products";
import Gallery from "@/components/product/Gallery";
import AddToCart from "@/components/product/AddToCart";
import SizeGuide from "@/components/product/SizeGuide";
import Reviews from "@/components/product/Reviews";

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

  return (
    <div className="min-h-screen bg-ink px-5 pb-24 pt-32 md:px-10 md:pt-40">
      <div className="grid gap-10 md:grid-cols-2 md:gap-16">
        <Gallery images={images} productName={product.name} />

        <div className="max-w-md">
          <p className="text-xs uppercase tracking-widest2 text-paper/40">{product.category.name}</p>
          <h1 className="mt-2 font-display text-3xl uppercase text-paper md:text-4xl">
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

          {product.sizeGuide && <SizeGuide rows={product.sizeGuide.rows as never} />}

          <Reviews reviews={product.reviews} />
        </div>
      </div>
    </div>
  );
}
