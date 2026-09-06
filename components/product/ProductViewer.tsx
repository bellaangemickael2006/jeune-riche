"use client";

import { useMemo, useState } from "react";
import Gallery from "@/components/product/Gallery";
import AddToCart from "@/components/product/AddToCart";
import SizeGuide from "@/components/product/SizeGuide";
import Reviews from "@/components/product/Reviews";
import WishlistButton from "@/components/product/WishlistButton";
import type { TechnicalDetail } from "@/lib/data/product-details";

type Img = { url: string; alt: string; type: string; color: string | null };
type Variant = { id: string; size: string; color: string; stock: number };
type ReviewType = Parameters<typeof Reviews>[0]["reviews"];

export default function ProductViewer({
  images,
  productName,
  productSlug,
  categoryName,
  description,
  price,
  variants,
  personalizationEnabled,
  personalizationMaxLen,
  sizeGuideRows,
  details,
  reviews,
}: {
  images: Img[];
  productName: string;
  productSlug: string;
  categoryName: string;
  description: string | null;
  price: number | null;
  variants: Variant[];
  personalizationEnabled: boolean;
  personalizationMaxLen: number;
  sizeGuideRows: unknown;
  details: TechnicalDetail[];
  reviews: ReviewType;
}) {
  const colors = useMemo(() => Array.from(new Set(variants.map((v) => v.color))), [variants]);
  const [color, setColor] = useState(colors[0] ?? "");

  // Ne filtrer que si au moins une image porte réellement une couleur : la
  // plupart des produits n'ont qu'un seul coloris et leurs images ne sont
  // pas taguées — dans ce cas on montre tout, comme avant. Le rendu change
  // donc réellement au clic sur un nuancier uniquement là où de vraies
  // photos existent pour chaque couleur (aujourd'hui : le T-shirt).
  const hasColorTags = images.some((i) => i.color);
  const filtered = hasColorTags ? images.filter((i) => !i.color || i.color === color) : images;
  const galleryImages = (filtered.length > 0 ? filtered : images).map((i) => ({
    url: i.url,
    alt: i.alt,
    type: i.type,
  }));
  const primaryImage = galleryImages[0]?.url ?? "";

  return (
    <div className="grid gap-10 md:grid-cols-2 md:gap-16">
      <Gallery key={color} images={galleryImages} productName={productName} />

      <div className="max-w-md">
        <p className="text-xs uppercase tracking-widest2 text-paper/40">{categoryName}</p>
        <h1 className="mt-2 font-editorial text-3xl text-paper md:text-4xl">{productName}</h1>
        {description && <p className="mt-4 text-sm leading-relaxed text-paper/60">{description}</p>}

        <div className="mt-8">
          <AddToCart
            productSlug={productSlug}
            productName={productName}
            price={price}
            image={primaryImage}
            variants={variants}
            personalizationEnabled={personalizationEnabled}
            personalizationMaxLen={personalizationMaxLen}
            color={color}
            onColorChange={setColor}
          />
        </div>

        <WishlistButton slug={productSlug} className="mt-4" />

        {sizeGuideRows ? <SizeGuide rows={sizeGuideRows as never} /> : null}

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

        <Reviews reviews={reviews} />
      </div>
    </div>
  );
}
