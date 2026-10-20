"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import Gallery from "@/components/product/Gallery";
import AddToCart from "@/components/product/AddToCart";
import SizeGuide from "@/components/product/SizeGuide";
import Reviews from "@/components/product/Reviews";
import ReviewForm from "@/components/product/ReviewForm";
import WishlistButton from "@/components/product/WishlistButton";
import { cn, formatPrice, getDropCountdown } from "@/lib/utils";
import { isDropLocked } from "@/lib/drops/live";
import { trackProductView } from "@/lib/recentlyViewed";
import type { TechnicalDetail } from "@/lib/data/product-details";
import CountdownTimer from "@/components/ui/CountdownTimer";
import BackButton from "@/components/ui/BackButton";
import { useLocale } from "@/components/providers/I18nProvider";
import type { DropSummary } from "@/types";

type Img = { url: string; alt: string; type: string; color: string | null };
type Variant = { id: string; size: string; color: string; stock: number };
type ReviewType = Parameters<typeof Reviews>[0]["reviews"];
type Model3D = { color: string | null; url: string };

// Chargée seulement à l'ouverture de l'onglet 3D (voir ModelViewer3D).
const ModelViewer3D = dynamic(() => import("@/components/product/ModelViewer3D"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-studio" />,
});

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
  drop,
  models = [],
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
  drop?: DropSummary | null;
  /** Modèles 3D VirtualThreads : un par couleur, ou un seul sans couleur. */
  models?: Model3D[];
}) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const countdown = getDropCountdown(drop);
  // Verrouillé jusqu'à l'ouverture du drop, puis débloqué pile à l'heure,
  // sans recharger la page (même règle que la commande côté serveur).
  const [locked, setLocked] = useState(() => isDropLocked(drop));
  useEffect(() => {
    if (!drop || !isDropLocked(drop)) return;
    const delay = new Date(drop.startsAt).getTime() - Date.now();
    // setTimeout plafonne à ~24,8 jours : au-delà, la page sera rechargée d'ici là.
    if (delay > 2_000_000_000) return;
    const id = setTimeout(() => setLocked(false), Math.max(0, delay));
    return () => clearTimeout(id);
  }, [drop]);
  const colors = useMemo(() => Array.from(new Set(variants.map((v) => v.color))), [variants]);
  const [color, setColor] = useState(colors[0] ?? "");
  const [personalization, setPersonalization] = useState("");

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

  const model = models.find((m) => m.color === color) ?? models.find((m) => !m.color) ?? null;
  const [view, setView] = useState<"photos" | "3d">("photos");
  const show3D = view === "3d" && model !== null;

  useEffect(() => {
    trackProductView({ slug: productSlug, name: productName, image: primaryImage || null, price });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- une seule fois par visite de la fiche, pas à chaque changement de couleur
  }, [productSlug]);

  return (
    <div>
      <BackButton label={t("product.back")} fallbackHref="/catalogue" className="mb-6 inline-block md:mb-8" />

      <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-start md:gap-16 lg:grid-cols-[1.35fr_1fr]">
        <div className="md:sticky md:top-32">
          {model && (
            <div role="tablist" aria-label={t("product.viewMode")} className="mb-3 flex gap-2">
              {(["photos", "3d"] as const).map((mode) => (
                <button
                  key={mode}
                  role="tab"
                  type="button"
                  aria-selected={(mode === "3d") === show3D}
                  onClick={() => setView(mode)}
                  className={cn(
                    "border px-4 py-2 text-label uppercase transition-colors",
                    (mode === "3d") === show3D ? "border-paper bg-paper text-ink" : "border-line text-paper/60 hover:text-paper"
                  )}
                >
                  {mode === "photos" ? t("product.viewPhotos") : t("product.view3D")}
                </button>
              ))}
            </div>
          )}
          {show3D && model ? (
            <div className="relative aspect-4/5 overflow-hidden bg-studio">
              <ModelViewer3D
                src={model.url}
                alt={`${productName} — ${color}`}
                poster={primaryImage || undefined}
                labels={{
                  hint: t("product.dragToRotate"),
                  loading: t("product.model3DLoading"),
                  error: t("product.model3DError"),
                  ar: t("product.viewInAR"),
                }}
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
              locked={locked}
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
