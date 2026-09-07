import { getStoreSettings } from "@/lib/data/settings";
import { updateStoreSettings } from "@/lib/actions/settings";

export default async function AdminSettingsPage() {
  const settings = await getStoreSettings();

  return (
    <div>
      <h1 className="font-display text-2xl uppercase text-paper">Paramètres</h1>
      <p className="mt-2 max-w-lg text-xs text-paper/40">
        Ces valeurs sont utilisées directement par le site (frais de livraison au moment du paiement,
        coordonnées de contact affichées aux clients).
      </p>

      {!settings ? (
        <p className="mt-4 border border-paper/30 bg-paper/5 px-4 py-3 text-xs text-paper">
          Base de données indisponible.
        </p>
      ) : (
        <form action={updateStoreSettings} className="mt-8 flex max-w-md flex-col gap-6">
          <div>
            <p className="mb-4 border-b border-line pb-2 text-xs uppercase tracking-widest2 text-paper/50">
              Livraison
            </p>
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-widest2 text-paper/50">
                Frais de livraison (F CFA)
              </span>
              <input
                name="shippingCost"
                type="number"
                min={0}
                step={1}
                defaultValue={Number(settings.shippingCost)}
                className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper"
              />
            </label>
            <label className="mt-4 block">
              <span className="mb-2 block text-xs uppercase tracking-widest2 text-paper/50">
                Livraison gratuite à partir de (F CFA) — laisser vide pour désactiver
              </span>
              <input
                name="freeShippingThreshold"
                type="number"
                min={0}
                step={1}
                defaultValue={
                  settings.freeShippingThreshold !== null ? Number(settings.freeShippingThreshold) : ""
                }
                className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper"
              />
            </label>
          </div>

          <div>
            <p className="mb-4 border-b border-line pb-2 text-xs uppercase tracking-widest2 text-paper/50">
              Contact
            </p>
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-widest2 text-paper/50">Email de contact</span>
              <input
                name="contactEmail"
                type="email"
                defaultValue={settings.contactEmail ?? ""}
                placeholder="ekipjeuneriche@gmail.com"
                className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/30"
              />
            </label>
            <label className="mt-4 block">
              <span className="mb-2 block text-xs uppercase tracking-widest2 text-paper/50">Téléphone / WhatsApp</span>
              <input
                name="contactPhone"
                defaultValue={settings.contactPhone ?? ""}
                placeholder="+225 07 77 58 53 67"
                className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/30"
              />
            </label>
          </div>

          <button className="w-fit bg-paper px-6 py-3 text-xs uppercase tracking-widest2 text-ink">
            Enregistrer
          </button>
        </form>
      )}
    </div>
  );
}
