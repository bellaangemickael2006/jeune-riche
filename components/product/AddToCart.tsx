"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/store/cart";
import { formatPrice, sanitizePersonalization, cn } from "@/lib/utils";

type Variant = { id: string; size: string; color: string; stock: number };

export default function AddToCart({
  productSlug,
  productName,
  price,
  image,
  variants,
  personalizationEnabled,
  personalizationMaxLen,
}: {
  productSlug: string;
  productName: string;
  price: number | null;
  image: string;
  variants: Variant[];
  personalizationEnabled: boolean;
  personalizationMaxLen: number;
}) {
  const colors = useMemo(() => Array.from(new Set(variants.map((v) => v.color))), [variants]);
  const [color, setColor] = useState(colors[0] ?? "");
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
      <p className="font-display text-2xl text-paper">{formatPrice(price)}</p>

      {colors.length > 0 && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-widest2 text-paper/50">Couleur</p>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  const first = variants.find((v) => v.color === c);
                  setSize(first?.size ?? "");
                }}
                className={cn(
                  "border px-4 py-2 text-xs uppercase tracking-widest2",
                  color === c ? "border-paper bg-paper text-ink" : "border-line text-paper/70"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {sizesForColor.length > 0 && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-widest2 text-paper/50">Taille</p>
          <div className="flex flex-wrap gap-2">
            {sizesForColor.map((v) => (
              <button
                key={v.id}
                onClick={() => setSize(v.size)}
                disabled={v.stock === 0}
                className={cn(
                  "h-10 w-10 border text-xs uppercase",
                  size === v.size ? "border-paper bg-paper text-ink" : "border-line text-paper/70",
                  v.stock === 0 && "cursor-not-allowed opacity-30 line-through"
                )}
              >
                {v.size}
              </button>
            ))}
          </div>
        </div>
      )}

      {personalizationEnabled && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-widest2 text-paper/50">
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
            <div className="mt-4 border border-line bg-line/30 px-4 py-6 text-center">
              <p className="text-[10px] uppercase tracking-widest2 text-paper/40">Aperçu</p>
              <p className="mt-2 font-display text-xl uppercase text-paper">{personalization}</p>
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleAdd}
        disabled={!canAdd}
        className={cn(
          "w-full py-4 text-xs uppercase tracking-widest2 transition-all",
          canAdd ? "bg-paper text-ink hover:opacity-90" : "cursor-not-allowed bg-line text-paper/40"
        )}
      >
        {price === null
          ? "Prix à définir"
          : !selectedVariant || !inStock
            ? "Indisponible"
            : added
              ? "Ajouté au panier ✓"
              : "Ajouter au panier"}
      </button>

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
