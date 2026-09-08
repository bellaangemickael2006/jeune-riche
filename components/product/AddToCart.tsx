"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/store/cart";
import { sanitizePersonalization, swatchColor, cn } from "@/lib/utils";

type Variant = { id: string; size: string; color: string; stock: number };

// Ordre de lecture d'un tableau de tailles. Toute taille non listée (une
// pointure de casquette, un format inattendu saisi en admin) est conservée et
// affichée après, jamais masquée.
const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "UNIQUE", "TU"];

function sortSizes(a: string, b: string) {
  const ia = SIZE_ORDER.indexOf(a.toUpperCase());
  const ib = SIZE_ORDER.indexOf(b.toUpperCase());
  if (ia === -1 && ib === -1) return a.localeCompare(b);
  if (ia === -1) return 1;
  if (ib === -1) return -1;
  return ia - ib;
}

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
    () => variants.filter((v) => v.color === color).sort((a, b) => sortSizes(a.size, b.size)),
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
    <div className="flex flex-col gap-8">
      {colors.length > 0 && (
        <div>
          <p className="mb-3 text-label text-paper/40">Couleur</p>
          <div className="flex flex-wrap gap-5">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setColor(c);
                  const first = variants
                    .filter((v) => v.color === c)
                    .sort((a, b) => sortSizes(a.size, b.size))[0];
                  setSize(first?.size ?? "");
                }}
                aria-pressed={color === c}
                className="flex flex-col items-start gap-2"
              >
                {/* La sélection est marquée par un filet décalé, posé sur le
                    fond ink, et non par une bordure au ras du nuancier : sur le
                    coloris Blanc, une bordure `paper` était invisible. */}
                <span
                  data-swatch
                  style={{ backgroundColor: swatchColor(c) }}
                  className={cn(
                    "h-8 w-8 border border-line transition-all duration-300 ease-editorial",
                    color === c
                      ? "outline outline-1 outline-offset-[3px] outline-paper"
                      : "opacity-70 hover:opacity-100"
                  )}
                />
                <span
                  className={cn(
                    "text-label transition-colors duration-300 ease-editorial",
                    color === c ? "text-paper" : "text-paper/35"
                  )}
                >
                  {c}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tailles en boutons rectangulaires avec quatre états explicites —
          défaut, survol, sélectionné, désactivé. Un <select> masquait la
          disponibilité derrière un clic et réduisait le bouton d'ajout à la
          moitié droite d'une ligne de formulaire. */}
      {sizesForColor.length > 0 && (
        <div>
          <p className="mb-3 text-label text-paper/40" id="taille-label">
            Taille
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby="taille-label">
            {sizesForColor.map((v) => {
              const isSelected = v.size === size;
              const isOut = v.stock === 0;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSize(v.size)}
                  disabled={isOut}
                  aria-pressed={isSelected}
                  className={cn(
                    "min-w-[3.5rem] border px-4 py-3 text-label transition-colors duration-300 ease-editorial",
                    isOut
                      ? "cursor-not-allowed border-line text-paper/20 line-through"
                      : isSelected
                        ? "border-paper bg-paper text-ink"
                        : "border-line text-paper/70 hover:border-paper hover:text-paper"
                  )}
                >
                  {v.size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* L'atelier : le champ, puis l'aperçu du marquage. Sobre, sur fond ink,
          dans la typographie réellement utilisée sur le vêtement. */}
      {personalizationEnabled && (
        <div>
          <p className="mb-3 text-label text-paper/40">Personnalisation</p>
          <input
            type="text"
            value={personalization}
            onChange={(e) =>
              setPersonalization(sanitizePersonalization(e.target.value, personalizationMaxLen))
            }
            maxLength={personalizationMaxLen}
            placeholder="Votre nom ou pseudo"
            aria-describedby="perso-aide"
            className="w-full border border-line bg-transparent px-4 py-3 text-body text-paper placeholder:text-paper/25 focus:border-paper focus:outline-none"
          />
          <div id="perso-aide" className="mt-2 flex items-center justify-between text-caption text-paper/35">
            <span>Lettres, chiffres, espaces, - et _ uniquement. Optionnel.</span>
            <span>
              {personalization.length}/{personalizationMaxLen}
            </span>
          </div>
          {personalization && (
            <div className="mt-5 border border-line px-6 py-10">
              <p className="text-label text-paper/30">Aperçu du marquage</p>
              <p className="mt-5 break-all font-display text-[2rem] uppercase leading-none text-paper">
                {personalization}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Une seule action principale, pleine largeur. Rien ne la concurrence. */}
      <div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!canAdd}
          className={cn(
            "w-full px-6 py-4 text-label transition-colors duration-300 ease-editorial",
            canAdd ? "bg-paper text-ink hover:bg-studio" : "cursor-not-allowed bg-line text-paper/35"
          )}
        >
          {price === null
            ? "Prix à définir"
            : !selectedVariant || !inStock
              ? "Indisponible"
              : added
                ? "Ajouté au panier"
                : "Ajouter"}
        </button>

        {selectedVariant && !inStock && (
          <div className="mt-5 border-t border-line pt-5">
            <p className="text-body text-paper/60">Indisponible.</p>
            <NotifyMe variantId={selectedVariant.id} />
          </div>
        )}
      </div>
    </div>
  );
}

function NotifyMe({ variantId }: { variantId: string }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await fetch("/api/restock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, email }),
      });
      setSent(true);
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <p className="mt-3 text-caption text-paper/60">
        Nous vous préviendrons dès le retour en stock.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Votre email"
        aria-label="Votre email pour être prévenu du retour en stock"
        className="w-full border border-line bg-transparent px-4 py-3 text-body text-paper placeholder:text-paper/25 focus:border-paper focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 border border-paper px-5 text-label text-paper transition-colors duration-300 ease-editorial hover:bg-paper hover:text-ink disabled:opacity-50"
      >
        Prévenez-moi
      </button>
    </form>
  );
}
