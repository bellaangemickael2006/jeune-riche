"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/store/cart";
import { sanitizePersonalization, swatchColor, cn } from "@/lib/utils";

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
  const [personalization, setPersonalization] = useState("");
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
