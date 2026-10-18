"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCart } from "@/store/cart";
import { sanitizePersonalization, swatchColor, cn, siteUrl, sortSizes, whatsappProductLink, LOW_STOCK_THRESHOLD } from "@/lib/utils";

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
  // Première taille disponible plutôt que la première tout court : arriver
  // sur une fiche avec une taille épuisée présélectionnée faisait croire que
  // tout le produit était indisponible.
  const [size, setSize] = useState(defaultSize(sizesForColor));
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
                  setSize(defaultSize(sortSizes(variants.filter((v) => v.color === c))));
                }}
                aria-pressed={color === c}
                className="flex flex-col items-center gap-1.5"
              >
                <span
                  style={{ backgroundColor: swatchColor(c) }}
                  className={cn(
                    "h-7 w-7 border transition-all",
                    color === c ? "border-paper ring-1 ring-offset-2 ring-offset-ink ring-paper" : "border-line/60"
                  )}
                />
                <span className={cn("text-[10px] uppercase tracking-wide", color === c ? "text-paper" : "text-paper/40")}>
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
              dans une liste déroulante.

              La bande s'enroule (flex-wrap) plutôt que de déborder : ce bloc
              vit dans la colonne info de la fiche, dont la largeur dépend du
              ratio de la grille et non du viewport. */}
          <div
            role="radiogroup"
            aria-label={t("product.size")}
            className="flex flex-wrap divide-x divide-line border border-line"
          >
            {sizesForColor.map((v) => {
              const isSelected = size === v.size;
              const soldOut = v.stock === 0;
              return (
                // Une taille épuisée reste sélectionnable : c'est le seul moyen
                // d'atteindre « Me prévenir » pour CETTE taille. Désactivée,
                // l'alerte de retour en stock n'était presque jamais proposée.
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSize(v.size)}
                  title={soldOut ? t("product.outOfStock") : undefined}
                  className={cn(
                    "min-w-[3.5rem] flex-1 px-4 py-3.5 font-display text-[11px] uppercase tracking-widest2 transition-colors",
                    isSelected && !soldOut && "bg-paper text-ink",
                    !isSelected && !soldOut && "text-paper/60 hover:bg-paper/5 hover:text-paper",
                    soldOut && "text-paper/25 line-through",
                    soldOut && isSelected && "bg-paper/10 text-paper/60"
                  )}
                >
                  {v.size}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleAdd}
            disabled={!canAdd}
            className={cn(
              "mt-4 w-full px-6 py-3.5 text-xs uppercase tracking-widest2 transition-all",
              canAdd ? "bg-paper text-ink hover:opacity-90" : "cursor-not-allowed bg-line text-paper/40"
            )}
          >
            {price === null
              ? t("product.priceUndefined")
              : !selectedVariant || !inStock
                ? t("product.unavailable")
                : added
                  ? t("product.added")
                  : t("product.addToCart")}
          </button>
          {selectedVariant && inStock && selectedVariant.stock <= LOW_STOCK_THRESHOLD && (
            <p className="mt-2 text-[11px] uppercase tracking-widest2 text-paper/70">
              {t("product.lowStock", { count: selectedVariant.stock })}
            </p>
          )}
        </div>
      )}

      {/* Canal de vente assisté : le message WhatsApp arrive déjà rempli avec
          le produit, la couleur et la taille sélectionnées — le client n'a
          rien à retaper. En Côte d'Ivoire, WhatsApp convertit souvent mieux
          qu'un tunnel de paiement web classique, d'où ce lien en plus (pas à
          la place) du panier. Le message reste toujours en français (voir
          lib/utils.ts) : c'est un message métier lu par l'équipe côté
          boutique, pas une chaîne d'interface visiteur. */}
      <a
        href={whatsappProductLink(productName, {
          color: color || undefined,
          size: size || undefined,
          personalization: personalization.trim() || undefined,
          url: `${siteUrl()}/catalogue/${productSlug}`,
        })}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 border border-line px-6 py-3 text-xs uppercase tracking-widest2 text-paper/70 transition-colors hover:border-paper hover:text-paper"
      >
        <WhatsAppIcon />
        {t("product.askOnWhatsapp")}
      </a>

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
          <div className="mt-2 flex items-center justify-between text-[11px] text-paper/40">
            <span>{t("product.personalizationHint")}</span>
            <span>
              {personalization.length}/{personalizationMaxLen}
            </span>
          </div>
          {personalization && (
            <div className="mt-4 flex flex-col items-center gap-3 border border-line bg-line/20 px-6 py-10">
              <p className="text-label text-paper/30">{t("product.personalizationPreview")}</p>
              <p className="font-display text-display uppercase leading-none text-paper">
                {personalization}
              </p>
            </div>
          )}
        </div>
      )}

      {/* key : changer de taille repart d'un formulaire vierge, sinon la
          confirmation d'une autre taille restait affichée. */}
      {!inStock && selectedVariant && <NotifyMe key={selectedVariant.id} variantId={selectedVariant.id} />}
    </div>
  );
}

function defaultSize(sizes: Variant[]) {
  return (sizes.find((v) => v.stock > 0) ?? sizes[0])?.size ?? "";
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
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState(false);

  // La confirmation s'affichait même quand l'enregistrement échouait (réseau
  // coupé, erreur serveur) : le client attendait un email qui ne viendrait pas.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setFailed(false);
    try {
      const res = await fetch("/api/restock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, email }),
      });
      if (res.ok) setSent(true);
      else setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  }

  if (sent) return <p className="text-xs text-paper/60">{t("product.notifyMeConfirmation")}</p>;

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
      {failed && <p role="alert" className="w-full text-xs text-paper">{t("footer.newsletterError")}</p>}
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("product.notifyMePlaceholder")}
        className="min-w-0 flex-1 border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/30 focus:border-paper focus:outline-none"
      />
      <button
        disabled={pending}
        className="shrink-0 border border-paper px-4 text-xs uppercase tracking-widest2 text-paper disabled:opacity-50"
      >
        {pending ? "…" : t("product.notifyMeButton")}
      </button>
    </form>
  );
}
