"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bulkUpdateStock } from "@/lib/actions/stock";
import { compareSizes, MANUAL_REASONS, MOVEMENT_REASONS, nextStock, type MovementReason, type StockMode } from "@/lib/stock/labels";
import { cn, LOW_STOCK_THRESHOLD } from "@/lib/utils";

type Variant = { id: string; color: string; size: string; stock: number };

/**
 * Grille couleurs × tailles pour modifier tout le stock d'un produit d'un
 * coup : « Définir » remplace les quantités, « Ajouter / retirer » saisit
 * une entrée (+) ou une sortie (−). Aperçu du résultat avant validation.
 */
export default function StockGrid({ productId, variants }: { productId: string; variants: Variant[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<StockMode>("add");
  const [reason, setReason] = useState<MovementReason>("reception");
  const [note, setNote] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const colors = useMemo(() => Array.from(new Set(variants.map((v) => v.color))).sort((a, b) => a.localeCompare(b, "fr")), [variants]);
  const sizes = useMemo(() => Array.from(new Set(variants.map((v) => v.size))).sort(compareSizes), [variants]);
  const byKey = useMemo(() => new Map(variants.map((v) => [`${v.color}|${v.size}`, v])), [variants]);

  // Lignes réellement modifiées, avec leur résultat calculé.
  const changes = variants.flatMap((v) => {
    const raw = values[v.id]?.trim();
    if (!raw) return [];
    const value = Number(raw);
    const after = nextStock(v.stock, value, mode);
    return [{ variant: v, value, after }];
  });
  const invalid = changes.filter((c) => c.after === null);
  const effective = changes.filter((c) => c.after !== null && c.after !== c.variant.stock);
  const units = effective.reduce((sum, c) => sum + ((c.after as number) - c.variant.stock), 0);

  function switchMode(next: StockMode) {
    setMode(next);
    setValues({});
    setReason(next === "set" ? "inventaire" : "reception");
    setMessage(null);
    setError(null);
  }

  /** Remplit une colonne / une ligne / toute la grille avec la même valeur. */
  function fill(filter: (v: Variant) => boolean) {
    const value = window.prompt(mode === "set" ? "Nouvelle quantité pour ces variantes :" : "Quantité à ajouter (négatif pour retirer) :");
    if (value === null || value.trim() === "" || Number.isNaN(Number(value))) return;
    setValues((prev) => {
      const next = { ...prev };
      for (const v of variants) if (filter(v)) next[v.id] = value.trim();
      return next;
    });
  }

  function save() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await bulkUpdateStock(productId, {
        mode,
        reason,
        note,
        changes: effective.map((c) => ({ variantId: c.variant.id, value: c.value })),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setValues({});
      setNote("");
      setMessage(result.message ?? "Stock mis à jour.");
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["add", "Ajouter / retirer"],
            ["set", "Définir les quantités"],
          ] as const
        ).map(([m, label]) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={cn(
              "border px-4 py-2 text-[11px] uppercase tracking-widest2",
              mode === m ? "border-paper bg-paper text-ink" : "border-line text-paper/60 hover:text-paper"
            )}
          >
            {label}
          </button>
        ))}
        <span className="text-[11px] text-paper/60">
          {mode === "add" ? "Ex. 10 pour une réception, −2 pour une casse." : "Saisissez le stock compté ; cases vides = inchangé."}
        </span>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="border-collapse text-sm">
          <thead>
            <tr>
              <th className="p-2 text-left">
                <button type="button" onClick={() => fill(() => true)} className="text-[11px] uppercase tracking-widest2 text-paper/60 hover:text-paper">
                  Tout remplir
                </button>
              </th>
              {sizes.map((size) => (
                <th key={size} className="p-2 text-center">
                  <button
                    type="button"
                    onClick={() => fill((v) => v.size === size)}
                    title="Remplir toute la colonne"
                    className="text-xs uppercase tracking-widest2 text-paper hover:underline"
                  >
                    {size}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {colors.map((color) => (
              <tr key={color} className="border-t border-line">
                <th className="p-2 text-left">
                  <button
                    type="button"
                    onClick={() => fill((v) => v.color === color)}
                    title="Remplir toute la ligne"
                    className="text-xs text-paper hover:underline"
                  >
                    {color}
                  </button>
                </th>
                {sizes.map((size) => {
                  const v = byKey.get(`${color}|${size}`);
                  if (!v) {
                    return (
                      <td key={size} className="p-2 text-center text-paper/20">
                        —
                      </td>
                    );
                  }
                  const raw = values[v.id] ?? "";
                  const after = raw.trim() ? nextStock(v.stock, Number(raw), mode) : v.stock;
                  const changed = raw.trim() !== "" && after !== v.stock;
                  return (
                    <td key={size} className="p-2 align-top">
                      <input
                        type="number"
                        inputMode="numeric"
                        step={1}
                        min={mode === "set" ? 0 : undefined}
                        value={raw}
                        onChange={(e) => setValues((prev) => ({ ...prev, [v.id]: e.target.value }))}
                        placeholder={mode === "set" ? String(v.stock) : "+0"}
                        aria-label={`${color} ${size}`}
                        className={cn(
                          "w-20 border bg-transparent px-2 py-1.5 text-center text-paper placeholder:text-paper/50 focus:outline-hidden",
                          after === null ? "border-paper bg-paper/10" : changed ? "border-paper" : "border-line focus:border-paper"
                        )}
                      />
                      <p
                        className={cn(
                          "mt-1 text-center text-[11px]",
                          after === null ? "text-paper" : v.stock <= LOW_STOCK_THRESHOLD ? "text-paper/70" : "text-paper/60"
                        )}
                      >
                        {after === null ? "sous 0 !" : changed ? `${v.stock} → ${after}` : `${v.stock} en stock`}
                      </p>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid max-w-2xl gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-widest2 text-paper/60">Motif</span>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as MovementReason)}
            className="w-full border border-line bg-transparent px-3 py-2 text-sm text-paper"
          >
            {MANUAL_REASONS.map((r) => (
              <option key={r} value={r} className="bg-ink">
                {MOVEMENT_REASONS[r]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-widest2 text-paper/60">Note (facultative)</span>
          <input
            value={note}
            maxLength={200}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex. livraison atelier du 20/10"
            className="w-full border border-line bg-transparent px-3 py-2 text-sm text-paper placeholder:text-paper/50"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={save}
          disabled={isPending || effective.length === 0 || invalid.length > 0}
          className="bg-paper px-6 py-3 text-xs uppercase tracking-widest2 text-ink disabled:opacity-40"
        >
          {isPending ? "Enregistrement…" : "Enregistrer le stock"}
        </button>
        {effective.length > 0 && invalid.length === 0 && (
          <p className="text-xs text-paper/60">
            {effective.length} variante{effective.length > 1 ? "s" : ""} · {units >= 0 ? "+" : ""}
            {units} pièce{Math.abs(units) > 1 ? "s" : ""}
          </p>
        )}
        {invalid.length > 0 && <p className="text-xs text-paper">Un stock ne peut pas passer sous zéro.</p>}
        {effective.length > 0 && (
          <button type="button" onClick={() => setValues({})} className="text-[11px] uppercase tracking-widest2 text-paper/60 hover:text-paper">
            Effacer la saisie
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-xs text-paper">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="mt-3 text-xs text-paper/60">
          {message}
        </p>
      )}
    </div>
  );
}
