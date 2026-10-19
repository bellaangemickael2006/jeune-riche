"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import Gallery from "@/components/product/Gallery";
import { garmentColor, garmentKindFor } from "@/lib/tryOn";
import { cn } from "@/lib/utils";

// Three.js (~600 Ko) n'est chargé qu'au clic sur « 3D », jamais avec la fiche.
const TryOn3D = dynamic(() => import("@/components/product/TryOn3D"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-studio" />,
});

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}
import AddToCart from "@/components/product/AddToCart";
import SizeGuide from "@/components/product/SizeGuide";
import Reviews from "@/components/product/Reviews";
import ReviewForm from "@/components/product/ReviewForm";
import WishlistButton from "@/components/product/WishlistButton";
import { formatPrice, getDropCountdown } from "@/lib/utils";
import { trackProductView } from "@/lib/recentlyViewed";
import type { TechnicalDetail } from "@/lib/data/product-details";
import CountdownTimer from "@/components/ui/CountdownTimer";
import BackButton from "@/components/ui/BackButton";
import { useLocale } from "@/components/providers/I18nProvider";
import type { DropSummary } from "@/types";

type Img = { url: string; alt: string; type: string; color: string | null };
type Variant = { id: string; size: string; color: string; stock: number };
type ReviewType = Parameters<typeof Reviews>[0]["reviews"];

export default function ProductViewer({
  images,
  productId,
  productName,
  productSlug,
  categoryName,
  categorySlug,
  description,
  price,
  variants,
  personalizationEnabled,
  personalizationMaxLen,
  sizeGuideRows,
  details,
  reviews,
  isLoggedIn,
  drop,
}: {
  images: Img[];
  productId: string;
  productName: string;
  productSlug: string;
  categoryName: string;
  categorySlug: string;
  description: string | null;
  price: number | null;
  variants: Variant[];
  personalizationEnabled: boolean;
  personalizationMaxLen: number;
  sizeGuideRows: unknown;
  details: TechnicalDetail[];
  reviews: ReviewType;
  isLoggedIn: boolean;
  drop?: DropSummary | null;
}) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const countdown = getDropCountdown(drop);
  const colors = useMemo(() => Array.from(new Set(variants.map((v) => v.color))), [variants]);
  const [color, setColor] = useState(colors[0] ?? "");
  const [personalization, setPersonalization] = useState("");
  const garmentKind = garmentKindFor(categorySlug);
  const [view, setView] = useState<"photos" | "3d">("photos");
  const [webgl, setWebgl] = useState(false);
  useEffect(() => setWebgl(supportsWebGL()), []);
  const show3D = Boolean(garmentKind) && webgl;

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
    <div>
      <BackButton label={t("product.back")} fallbackHref="/catalogue" className="mb-6 inline-block md:mb-8" />

      <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-start md:gap-16 lg:grid-cols-[1.35fr_1fr]">
        <div className="md:sticky md:top-32">
          {show3D && (
            <div role="tablist" aria-label={t("product.viewMode")} className="mb-3 flex gap-2">
              {(["photos", "3d"] as const).map((mode) => (
                <button
                  key={mode}
                  role="tab"
                  type="button"
                  aria-selected={view === mode}
                  onClick={() => setView(mode)}
                  className={cn(
                    "border px-4 py-2 text-label uppercase transition-colors",
                    view === mode ? "border-paper bg-paper text-ink" : "border-line text-paper/60 hover:text-paper"
                  )}
                >
                  {mode === "photos" ? t("product.viewPhotos") : t("product.view3D")}
                </button>
              ))}
            </div>
          )}
          {show3D && view === "3d" && garmentKind ? (
            <div className="relative aspect-[4/5] overflow-hidden bg-studio">
              <TryOn3D
                kind={garmentKind}
                color={garmentColor(color)}
                personalization={personalizationEnabled ? personalization : ""}
                hint={t("product.dragToRotate")}
              />
            </div>
          ) : (
            <Gallery
              key={color}
              images={galleryImages}
              productName={productName}
              personalization={personalization}
            />
          )}
        </div>

        <div className="max-w-md">
          <p className="text-label text-paper/40">{categoryName}</p>
          <h1 className="mt-3 font-editorial text-heading text-paper md:text-heading-lg">{productName}</h1>
          <p className="mt-4 font-editorial text-heading text-paper">{formatPrice(price, locale, t("product.priceUndefined"))}</p>
          {description && <p className="mt-4 text-body leading-relaxed text-paper/60">{description}</p>}

          {countdown && (
            <div className="mt-6">
              <CountdownTimer target={countdown.target} labelKey={countdown.labelKey} />
            </div>
          )}

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
              personalization={personalization}
              onPersonalizationChange={setPersonalization}
            />
          </div>

          <WishlistButton slug={productSlug} className="mt-4" />

          {sizeGuideRows ? <SizeGuide rows={sizeGuideRows as never} /> : null}

          <div className="mt-10 border-t border-line pt-6">
            <p className="text-label text-paper/50">{t("product.details")}</p>
            <dl className="mt-4 flex flex-col gap-3">
              {details.map((d) => (
                <div key={d.label} className="flex justify-between gap-6 text-caption">
                  <dt className="text-paper/40">{d.label}</dt>
                  <dd className="text-right text-paper/80">{d.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <Reviews reviews={reviews} />
          <ReviewForm productId={productId} productSlug={productSlug} isLoggedIn={isLoggedIn} />
        </div>
      </div>
    </div>
  );
}
