"use client";

import { useState } from "react";
import ActionForm, { SubmitButton } from "@/components/admin/ActionForm";
import { resetStoreData } from "@/lib/actions/settings";
import { RESET_CONFIRMATION } from "@/lib/demoReset";

const OPTIONS = [
  {
    name: "activity",
    label: "Commandes et activité",
    hint: "Commandes, avis, favoris, paniers, alertes de stock ; compteurs des codes promo remis à 0.",
    defaultChecked: true,
  },
  { name: "newsletter", label: "Abonnés newsletter", hint: "Toute la liste des abonnés.", defaultChecked: true },
  { name: "stock", label: "Stocks à 0", hint: "Toutes les variantes passent à 0 en stock.", defaultChecked: false },
  {
    name: "clients",
    label: "Comptes clients",
    hint: "Supprime les clients et leur connexion. Les comptes administrateurs sont toujours conservés.",
    defaultChecked: false,
  },
  {
    name: "catalogue",
    label: "Catalogue",
    hint: "Produits, images, vidéos, drops et codes promo. Les catégories sont conservées.",
    defaultChecked: false,
  },
] as const;

export default function DemoResetForm() {
  const [typed, setTyped] = useState("");
  const armed = typed.trim() === RESET_CONFIRMATION;

  return (
    <ActionForm
      action={async (formData) => {
        if (!window.confirm("Formater les données cochées ? Cette action est définitive.")) return;
        const result = await resetStoreData(formData);
        if (result.ok) setTyped("");
        return result;
      }}
      className="flex flex-col gap-4"
    >
      <fieldset className="flex flex-col gap-3">
        {OPTIONS.map((o) => (
          <label key={o.name} className="flex items-start gap-3 text-sm text-paper/80">
            <input type="checkbox" name={o.name} defaultChecked={o.defaultChecked} className="mt-1 h-4 w-4" />
            <span>
              {o.label}
              <span className="block text-[11px] text-paper/40">{o.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <label className="block">
        <span className="mb-2 block text-xs uppercase tracking-widest2 text-paper/50">
          Tapez {RESET_CONFIRMATION} pour confirmer
        </span>
        <input
          name="confirmation"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          className="w-full border border-line bg-transparent px-4 py-3 text-sm uppercase text-paper"
        />
      </label>

      {armed ? (
        <SubmitButton
          pendingLabel="Formatage…"
          className="w-fit border border-paper bg-paper px-6 py-3 text-xs uppercase tracking-widest2 text-ink"
        >
          Formater les données
        </SubmitButton>
      ) : (
        <button
          type="button"
          disabled
          className="w-fit border border-line px-6 py-3 text-xs uppercase tracking-widest2 text-paper/30"
        >
          Formater les données
        </button>
      )}
    </ActionForm>
  );
}
