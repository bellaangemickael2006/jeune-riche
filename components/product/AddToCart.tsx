"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCart } from "@/store/cart";
import { sanitizePersonalization, swatchColor, cn, siteUrl, sortSizes, whatsappProductLink, LOW_STOCK_THRESHOLD } from "@/lib/utils";
import { Action, ActionExternal } from "@/components/ui/Action";

type Variant = { id: string; size: string; color: string; stock: number };

export default function AddToCart({
  productSlug,
  productName,
  price,
  image,
  variants,
  personalizationEnabled,
  personalizationMaxLen,
  color: controlledColor,
  onColorChange,
  personalization: controlledPersonalization,
  onPersonalizationChange,
}: {
  productSlug: string;
  productName: string;
  price: number | null;
  image: string;
  variants: Variant[];
  personalizationEnabled: boolean;
  personalizationMaxLen: number;
  /** Couleur pilotée par un parent (ex. pour synchroniser la galerie photo).
   * Si omis, le composant gère sa propre sélection en interne. */
  color?: string;
  onColorChange?: (color: string) => void;
  /** Idem pour la personnalisation, pour l'afficher en direct sur la galerie. */
  personalization?: string;
  onPersonalizationChange?: (value: string) => void;
}) {
  const { t } = useTranslation();
  const colors = useMemo(() => Array.from(new Set(variants.map((v) => v.color))), [variants]);
  const [internalColor, setInternalColor] = useState(colors[0] ?? "");
  const color = controlledColor ?? internalColor;
  const setColor = onColorChange ?? setInternalColor;
  const sizesForColor = useMemo(
    () => sortSizes(variants.filter((v) => v.color === color)),
    [variants, color]
  );
  const [size, setSize] = useState(sizesForColor[0]?.size ?? "");
  const [internalPersonalization, setInternalPersonalization] = useState("");
  const personalization = controlledPersonalization ?? internalPersonalization;
  const setPersonalization = onPersonalizationChange ?? setInternalPersonalization;
  const [added, setAdded] = useState(false);
  const addLine = useCart((s) => s.addLine);

  const selectedVariant = variants.find((v) => v.color === color && v.size === size);
  const inStock = (selectedVariant?.stock ?? 0) > 0;
  const canAdd = Boolean(selectedVariant) && inStock && price !== null;

  function handleAdd() {
    if (!selectedVariant || price === null) return;
    addLine({
      variantId: selectedVariant.id,
      productSlug,
      productName,
      size: selectedVariant.size,
      color: selectedVariant.color,
      quantity: 1,
      personalization: personalization.trim() ? personalization.trim() : null,
      unitPrice: price,
      image,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="flex flex-col gap-6">
      {colors.length > 0 && (
        <div>
          <p className="mb-2 text-label text-paper/50">{t("product.color")}</p>
          <div className="flex flex-wrap gap-4">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  const first = sortSizes(variants.filter((v) => v.color === c))[0];
                  setSize(first?.size ?? "");
                }}
                aria-pressed={color === c}
                className="flex flex-col items-center gap-1.5"
              >
                {/* Carré franc, pas de pastille ronde ni d'anneau : le
                    coloris actif est celui dont le filet passe en papier
                    plein et dont le nom s'allume. Le rayon 0 est une
                    décision de marque, il vaut aussi pour les nuanciers. */}
                <span
                  style={{ backgroundColor: swatchColor(c) }}
                  className={cn(
                    "h-8 w-8 border transition-colors",
                    color === c ? "border-paper" : "border-line/60"
                  )}
                />
                <span className={cn("text-label", color === c ? "text-paper" : "text-paper/35")}>
                  {c}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {sizesForColor.length > 0 && (
        <div>
          <p className="mb-3 text-label text-paper/50">{t("product.size")}</p>
          {/* Les tailles vivaient dans un <select> natif : le composant le
              plus anonyme du web pour une décision qui mérite d'être vue — et
              elles en sortaient dans l'ordre d'insertion en base (XL, M, L,
              S). Désormais une bande de cellules à filet, triée, où les
              tailles épuisées restent visibles et barrées plutôt que cachées
              dans une liste déroulante. */}
          <div
            role="radiogroup"
            aria-label={t("product.size")}
            className="flex flex-wrap divide-x divide-line border border-line"
          >
            {sizesForColor.map((v) => {
              const isSelected = size === v.size;
              const soldOut = v.stock === 0;
              return (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={soldOut}
                  onClick={() => setSize(v.size)}
                  title={soldOut ? t("product.outOfStock") : undefined}
                  className={cn(
                    "min-w-[3.5rem] flex-1 px-4 py-3.5 font-display text-[11px] uppercase tracking-widest2 transition-colors",
                    isSelected && !soldOut && "bg-paper text-ink",
                    !isSelected && !soldOut && "text-paper/60 hover:bg-paper/5 hover:text-paper",
                    soldOut && "cursor-not-allowed text-paper/20 line-through"
                  )}
                >
                  {v.size}
                </button>
              );
            })}
          </div>

          {/* Un seul appel à l'action dominant sur la fiche : WhatsApp et les
              favoris descendent d'un rang typographique au lieu de se
              disputer l'attention au même poids. */}
          <Action onClick={handleAdd} disabled={!canAdd} family="engager" className="mt-4 w-full">
            {price === null
              ? t("product.priceUndefined")
              : !selectedVariant || !inStock
                ? t("product.unavailable")
                : added
                  ? t("product.added")
                  : t("product.addToCart")}
          </Action>

          {selectedVariant && inStock && selectedVariant.stock <= LOW_STOCK_THRESHOLD && (
            <p className="text-label mt-3 text-paper/70">
              {t("product.lowStock", { count: selectedVariant.stock })}
            </p>
          )}
        </div>
      )}

      {/* WhatsApp n'est pas un widget de support : sur ce marché c'est un
          canal de vente à part entière. Il garde donc la grammaire des
          actions du site (famille « poursuivre ») au lieu d'un bouton vert
          générique — le message arrive déjà rempli avec la pièce, le
          coloris, la taille, la personnalisation et l'adresse. */}
      <ActionExternal
        href={whatsappProductLink(productName, {
          color: color || undefined,
          size: size || undefined,
          personalization: personalization.trim() || undefined,
          url: `${siteUrl()}/catalogue/${productSlug}`,
        })}
        family="poursuivre"
        className="w-full"
      >
        <WhatsAppIcon />
        {t("product.askOnWhatsapp")}
      </ActionExternal>

      {personalizationEnabled && (
        <div>
          <p className="mb-2 text-label text-paper/50">{t("product.personalization")}</p>
          <input
            type="text"
            value={personalization}
            onChange={(e) =>
              setPersonalization(sanitizePersonalization(e.target.value, personalizationMaxLen))
            }
            maxLength={personalizationMaxLen}
            placeholder={t("product.personalizationPlaceholder")}
            className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/30 focus:border-paper focus:outline-none"
          />
          {/* L'aperçu était dupliqué : un encadré gris répétait le prénom en
              gros sous le champ, alors que la galerie le compose déjà en
              direct sur le vêtement. Seul le rendu sur la pièce est gardé —
              c'est le seul qui montre ce qui sera réellement imprimé. */}
          <div className="mt-2 flex items-center justify-between text-[11px] text-paper/40">
            <span>{t("product.personalizationHint")}</span>
            <span className="tabular-nums">
              {personalization.length}/{personalizationMaxLen}
            </span>
          </div>
        </div>
      )}

      {!inStock && selectedVariant && <NotifyMe variantId={selectedVariant.id} />}
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-4 w-4 shrink-0 text-[#25D366]" fill="currentColor" aria-hidden="true">
      <path d="M16.004 3C9.377 3 4 8.373 4 15c0 2.34.678 4.52 1.85 6.36L4 29l7.84-1.81A11.94 11.94 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Zm0 21.75a9.7 9.7 0 0 1-4.95-1.36l-.355-.21-4.653 1.074 1.09-4.53-.232-.372A9.68 9.68 0 0 1 5.25 15c0-5.93 4.824-10.75 10.754-10.75S26.758 9.07 26.758 15 21.934 24.75 16.004 24.75Zm5.68-7.77c-.31-.156-1.837-.907-2.122-1.01-.285-.104-.492-.156-.699.156-.207.312-.802 1.01-.984 1.217-.181.208-.362.234-.673.078-.31-.156-1.31-.483-2.495-1.54-.923-.823-1.546-1.84-1.727-2.152-.181-.312-.02-.481.136-.636.14-.14.31-.364.466-.546.155-.182.207-.312.31-.52.104-.208.052-.39-.026-.546-.078-.156-.699-1.685-.958-2.308-.252-.605-.508-.523-.699-.533l-.595-.01c-.207 0-.543.078-.828.39-.285.312-1.086 1.06-1.086 2.588 0 1.528 1.112 3.005 1.267 3.213.155.208 2.19 3.343 5.307 4.688.741.32 1.32.512 1.771.655.744.237 1.421.204 1.957.124.597-.089 1.837-.75 2.096-1.474.259-.723.259-1.343.181-1.474-.078-.13-.285-.208-.596-.364Z" />
    </svg>
  );
}

function NotifyMe({ variantId }: { variantId: string }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/restock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId, email }),
    });
    setSent(true);
  }

  if (sent) return <p className="text-xs text-paper/60">{t("product.notifyMeConfirmation")}</p>;

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("product.notifyMePlaceholder")}
        className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/30 focus:border-paper focus:outline-none"
      />
      <button className="shrink-0 border border-paper px-4 text-xs uppercase tracking-widest2 text-paper">
        {t("product.notifyMeButton")}
      </button>
    </form>
  );
}
