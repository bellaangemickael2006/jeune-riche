"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/store/cart";
import { sanitizePersonalization, swatchColor, cn, siteUrl, whatsappProductLink } from "@/lib/utils";

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
  const colors = useMemo(() => Array.from(new Set(variants.map((v) => v.color))), [variants]);
  const [internalColor, setInternalColor] = useState(colors[0] ?? "");
  const color = controlledColor ?? internalColor;
  const setColor = onColorChange ?? setInternalColor;
  const sizesForColor = useMemo(
    () => variants.filter((v) => v.color === color),
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
          <p className="mb-2 text-label text-paper/50">Couleur</p>
          <div className="flex flex-wrap gap-4">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  const first = variants.find((v) => v.color === c);
                  setSize(first?.size ?? "");
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
          <label htmlFor="size-select" className="mb-2 block text-label text-paper/50">
            Taille
          </label>
          <div className="flex gap-3">
            <select
              id="size-select"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="flex-1 border border-line bg-transparent px-4 py-3 text-sm uppercase text-paper focus:border-paper focus:outline-none"
            >
              {sizesForColor.map((v) => (
                <option key={v.id} value={v.size} disabled={v.stock === 0} className="bg-ink">
                  {v.size}
                  {v.stock === 0 ? " — épuisé" : ""}
                </option>
              ))}
            </select>
            <button
              onClick={handleAdd}
              disabled={!canAdd}
              className={cn(
                "shrink-0 px-6 py-3 text-xs uppercase tracking-widest2 transition-all",
                canAdd ? "bg-paper text-ink hover:opacity-90" : "cursor-not-allowed bg-line text-paper/40"
              )}
            >
              {price === null
                ? "Prix à définir"
                : !selectedVariant || !inStock
                  ? "Indisponible"
                  : added
                    ? "Ajouté ✓"
                    : "Ajouter au panier"}
            </button>
          </div>
        </div>
      )}

      {/* Canal de vente assisté : le message WhatsApp arrive déjà rempli avec
          le produit, la couleur et la taille sélectionnées — le client n'a
          rien à retaper. En Côte d'Ivoire, WhatsApp convertit souvent mieux
          qu'un tunnel de paiement web classique, d'où ce lien en plus (pas à
          la place) du panier. */}
      <a
        href={whatsappProductLink(productName, {
          color: color || undefined,
          size: size || undefined,
          url: `${siteUrl()}/catalogue/${productSlug}`,
        })}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 border border-line px-6 py-3 text-xs uppercase tracking-widest2 text-paper/70 transition-colors hover:border-paper hover:text-paper"
      >
        <WhatsAppIcon />
        Demander sur WhatsApp
      </a>

      {personalizationEnabled && (
        <div>
          <p className="mb-2 text-label text-paper/50">
            Personnalisation (optionnelle)
          </p>
          <input
            type="text"
            value={personalization}
            onChange={(e) =>
              setPersonalization(sanitizePersonalization(e.target.value, personalizationMaxLen))
            }
            maxLength={personalizationMaxLen}
            placeholder="Votre nom ou pseudo"
            className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/30 focus:border-paper focus:outline-none"
          />
          <div className="mt-2 flex items-center justify-between text-[11px] text-paper/40">
            <span>Lettres, chiffres, espaces, - et _ uniquement.</span>
            <span>
              {personalization.length}/{personalizationMaxLen}
            </span>
          </div>
          {personalization && (
            <div className="mt-4 flex flex-col items-center gap-3 border border-line bg-line/20 px-6 py-10">
              <p className="text-label text-paper/30">Aperçu de la broderie</p>
              <p className="font-display text-display uppercase leading-none text-paper">
                {personalization}
              </p>
            </div>
          )}
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

  if (sent) return <p className="text-xs text-paper/60">Nous vous préviendrons dès le retour en stock.</p>;

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Votre email"
        className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/30 focus:border-paper focus:outline-none"
      />
      <button className="shrink-0 border border-paper px-4 text-xs uppercase tracking-widest2 text-paper">
        Me prévenir
      </button>
    </form>
  );
}
