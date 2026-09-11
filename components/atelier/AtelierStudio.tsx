"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import PersonalizedPiece, { hasPersonalizationOverlay } from "@/components/product/PersonalizedPiece";
import { Action, ActionLink, ActionExternal } from "@/components/ui/Action";
import { useCart } from "@/store/cart";
import {
  sanitizePersonalization,
  swatchColor,
  cn,
  formatPrice,
  siteUrl,
  sortSizes,
  whatsappProductLink,
} from "@/lib/utils";
import { useLocale } from "@/components/providers/I18nProvider";

export type AtelierPiece = {
  slug: string;
  name: string;
  price: number | null;
  personalizationMaxLen: number;
  images: { url: string; alt: string; color: string | null }[];
  variants: { id: string; size: string; color: string; stock: number }[];
};

// L'atelier. La personnalisation existait déjà, mais enfouie au bas d'une
// fiche produit, en option cochée après coup. Ici elle est le sujet : on
// entre par le nom, et la pièce le porte immédiatement.
//
// Rien n'est réécrit du moteur de rendu — c'est le même calibrage que la
// galerie produit (PersonalizedPiece). Ce qui change, c'est l'ordre : le nom
// d'abord, la pièce ensuite.
export default function AtelierStudio({
  pieces,
  initialName = "",
}: {
  pieces: AtelierPiece[];
  initialName?: string;
}) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const addLine = useCart((s) => s.addLine);

  // On n'expose que les pièces dont au moins une photo est calibrée : sans
  // calibrage, on ne sait pas où le nom sera imprimé, et le montrer au
  // hasard serait mentir sur le rendu.
  const usable = useMemo(
    () => pieces.filter((p) => p.images.some((i) => hasPersonalizationOverlay(i.url))),
    [pieces]
  );

  const [pieceSlug, setPieceSlug] = useState(usable[0]?.slug ?? "");
  const piece = usable.find((p) => p.slug === pieceSlug) ?? usable[0];

  const calibrated = useMemo(
    () => (piece ? piece.images.filter((i) => hasPersonalizationOverlay(i.url)) : []),
    [piece]
  );
  const [imageUrl, setImageUrl] = useState(calibrated[0]?.url ?? "");
  const activeImage = calibrated.find((i) => i.url === imageUrl) ?? calibrated[0];

  const [name, setName] = useState(initialName);
  const [added, setAdded] = useState(false);

  const colorOfImage = activeImage?.color ?? null;
  const sizes = useMemo(
    () =>
      piece
        ? sortSizes(piece.variants.filter((v) => (colorOfImage ? v.color === colorOfImage : true)))
        : [],
    [piece, colorOfImage]
  );
  const [size, setSize] = useState("");
  const selected = sizes.find((v) => v.size === size) ?? null;
  const canAdd = Boolean(piece && selected && selected.stock > 0 && piece.price !== null);

  if (!piece || !activeImage) {
    return (
      <p className="text-body max-w-md text-paper/50">{t("atelier.unavailable")}</p>
    );
  }

  function selectPiece(slug: string) {
    const next = usable.find((p) => p.slug === slug);
    if (!next) return;
    setPieceSlug(slug);
    const firstCalibrated = next.images.find((i) => hasPersonalizationOverlay(i.url));
    setImageUrl(firstCalibrated?.url ?? "");
    setSize("");
  }

  function handleAdd() {
    if (!piece || !selected || piece.price === null) return;
    addLine({
      variantId: selected.id,
      productSlug: piece.slug,
      productName: piece.name,
      size: selected.size,
      color: selected.color,
      quantity: 1,
      personalization: name.trim() ? name.trim() : null,
      unitPrice: piece.price,
      image: activeImage!.url,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="grid gap-10 md:grid-cols-[1.15fr_1fr] md:items-start md:gap-16">
      {/* La pièce, en grand, sur son fond studio. */}
      <div className="md:sticky md:top-28">
        <div className="relative aspect-[4/5] overflow-hidden bg-studio">
          <PersonalizedPiece
            src={activeImage.url}
            alt={activeImage.alt}
            text={name}
            priority
            sizes="(max-width: 768px) 100vw, 52vw"
            padding="p-6 md:p-10"
          />
        </div>

        {calibrated.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {calibrated.map((img) => (
              <button
                key={img.url}
                onClick={() => {
                  setImageUrl(img.url);
                  setSize("");
                }}
                className={cn(
                  "relative h-16 w-14 overflow-hidden bg-studio transition-opacity",
                  img.url === activeImage.url ? "ring-1 ring-paper" : "opacity-50 hover:opacity-100"
                )}
                aria-label={img.alt}
              >
                <PersonalizedPiece src={img.url} alt={img.alt} sizes="56px" padding="p-1" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-md">
        {/* 1 — le nom. C'est la première décision, pas la dernière. */}
        <label className="block">
          <span className="text-label text-paper/50">{t("atelier.stepName")}</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(sanitizePersonalization(e.target.value, piece.personalizationMaxLen))}
            maxLength={piece.personalizationMaxLen}
            placeholder={t("product.personalizationPlaceholder")}
            autoComplete="off"
            className="mt-3 w-full border border-line bg-transparent px-4 py-4 font-display text-lg uppercase tracking-widest2 text-paper placeholder:font-body placeholder:text-sm placeholder:normal-case placeholder:tracking-normal placeholder:text-paper/25 focus:border-paper focus:outline-none"
          />
          <span className="mt-2 flex items-center justify-between text-[11px] text-paper/40">
            <span>{t("product.personalizationHint")}</span>
            <span className="tabular-nums">
              {name.length}/{piece.personalizationMaxLen}
            </span>
          </span>
        </label>

        {/* 2 — la pièce. */}
        {usable.length > 1 && (
          <div className="mt-10">
            <p className="text-label text-paper/50">{t("atelier.stepPiece")}</p>
            <div className="mt-3 flex flex-wrap divide-x divide-line border border-line">
              {usable.map((p) => (
                <button
                  key={p.slug}
                  onClick={() => selectPiece(p.slug)}
                  className={cn(
                    "flex-1 px-4 py-3.5 font-display text-[11px] uppercase tracking-widest2 transition-colors",
                    p.slug === piece.slug ? "bg-paper text-ink" : "text-paper/60 hover:bg-paper/5 hover:text-paper"
                  )}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3 — le coloris, déduit de la photo calibrée sélectionnée. */}
        {colorOfImage && (
          <div className="mt-10">
            <p className="text-label text-paper/50">{t("product.color")}</p>
            <div className="mt-3 flex items-center gap-3">
              <span
                style={{ backgroundColor: swatchColor(colorOfImage) }}
                className="h-8 w-8 border border-paper"
              />
              <span className="text-label text-paper">{colorOfImage}</span>
            </div>
          </div>
        )}

        {/* 4 — la taille. */}
        {sizes.length > 0 && (
          <div className="mt-10">
            <p className="text-label text-paper/50">{t("product.size")}</p>
            <div
              role="radiogroup"
              aria-label={t("product.size")}
              className="mt-3 flex flex-wrap divide-x divide-line border border-line"
            >
              {sizes.map((v) => {
                const soldOut = v.stock === 0;
                return (
                  <button
                    key={v.id}
                    type="button"
                    role="radio"
                    aria-checked={size === v.size}
                    disabled={soldOut}
                    onClick={() => setSize(v.size)}
                    className={cn(
                      "min-w-[3.5rem] flex-1 px-4 py-3.5 font-display text-[11px] uppercase tracking-widest2 transition-colors",
                      size === v.size && !soldOut && "bg-paper text-ink",
                      size !== v.size && !soldOut && "text-paper/60 hover:bg-paper/5 hover:text-paper",
                      soldOut && "cursor-not-allowed text-paper/20 line-through"
                    )}
                  >
                    {v.size}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <p className="mt-10 font-editorial text-2xl tabular-nums text-paper">
          {formatPrice(piece.price, locale, t("product.priceUndefined"))}
        </p>

        <div className="mt-5 flex flex-col gap-3">
          <Action onClick={handleAdd} disabled={!canAdd} family="engager" className="w-full">
            {added ? t("product.added") : t("product.addToCart")}
          </Action>

          <ActionExternal
            href={whatsappProductLink(piece.name, {
              color: colorOfImage || undefined,
              size: size || undefined,
              personalization: name.trim() || undefined,
              url: `${siteUrl()}/atelier`,
            })}
            family="poursuivre"
            className="w-full"
          >
            {t("product.askOnWhatsapp")}
          </ActionExternal>

          <ActionLink href={`/catalogue/${piece.slug}`} family="passer" className="self-start">
            {t("atelier.seeFullPiece")}
          </ActionLink>
        </div>
      </div>
    </div>
  );
}
