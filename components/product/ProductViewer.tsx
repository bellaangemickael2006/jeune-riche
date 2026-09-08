"use client";

import { useEffect, useMemo, useState } from "react";
import Gallery from "@/components/product/Gallery";
import AddToCart from "@/components/product/AddToCart";
import SizeGuide from "@/components/product/SizeGuide";
import Reviews from "@/components/product/Reviews";
import ReviewForm from "@/components/product/ReviewForm";
import WishlistButton from "@/components/product/WishlistButton";
import { formatPrice } from "@/lib/utils";
import { trackProductView } from "@/lib/recentlyViewed";
import type { TechnicalDetail } from "@/lib/data/product-details";

type Img = { url: string; alt: string; type: string; color: string | null };
type Variant = { id: string; size: string; color: string; stock: number };
type ReviewType = Parameters<typeof Reviews>[0]["reviews"];

export default function ProductViewer({
  images,
  productId,
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
  isLoggedIn,
}: {
  images: Img[];
  productId: string;
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
  isLoggedIn: boolean;
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

  useEffect(() => {
    trackProductView({ slug: productSlug, name: productName, image: primaryImage || null, price });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- une seule fois par visite de la fiche, pas à chaque changement de couleur
  }, [productSlug]);

  return (
    <>
      {/* La photographie pèse plus que l'interface : la galerie prend une fois
          et demie la largeur du panneau d'achat. Les avis sortent de cette
          colonne — ils n'ont rien à faire au milieu du parcours d'achat — et
          passent en pleine largeur sous la fiche. */}
      <div className="grid gap-12 md:grid-cols-[1.4fr_1fr] md:items-start md:gap-16 lg:gap-24">
        <div>
          <Gallery key={color} images={galleryImages} productName={productName} />
        </div>

        {/* C'est le panneau d'achat qui reste à l'écran, pas la photographie :
            les vues sont désormais empilées, donc c'est la colonne de gauche
            qui défile. */}
        <div className="max-w-md md:sticky md:top-32">
          <p className="text-label text-paper/40">{categoryName}</p>
          <h1 className="mt-4 font-editorial text-heading leading-[1.1] text-paper md:text-heading-lg">
            {productName}
          </h1>
          {/* Le prix ne s'affiche qu'une fois sur la page, sans prix barré ni
              pourcentage : la valeur est annoncée, elle n'est pas négociée. */}
          <p className="mt-5 text-body text-paper/80">{formatPrice(price)}</p>
          {description && (
            <p className="mt-6 max-w-sm text-body leading-relaxed text-paper/55">{description}</p>
          )}

          <div className="mt-10">
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

          {/* Actions secondaires — nettement plus discrètes que « Ajouter ». */}
          <div className="mt-8">
            <WishlistButton slug={productSlug} />
          </div>
          {sizeGuideRows ? (
            <div className="mt-6">
              <SizeGuide rows={sizeGuideRows as never} />
            </div>
          ) : null}

          <div className="mt-12 border-t border-line pt-6">
            <p className="text-label text-paper/40">Détails</p>
            <dl className="mt-5 flex flex-col gap-4">
              {details.map((d) => (
                <div key={d.label} className="flex justify-between gap-8 text-caption">
                  <dt className="shrink-0 text-paper/40">{d.label}</dt>
                  <dd className="text-right text-paper/80">{d.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      <section className="mt-28 border-t border-line pt-12 md:mt-40">
        <p className="text-label text-paper/40">Avis</p>
        <div className="mt-8 grid gap-12 md:grid-cols-2 md:gap-20">
          <Reviews reviews={reviews} />
          <ReviewForm productId={productId} productSlug={productSlug} isLoggedIn={isLoggedIn} />
        </div>
      </section>
    </>
  );
}
