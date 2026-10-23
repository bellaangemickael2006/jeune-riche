import { getStoreSettings } from "@/lib/data/settings";
import { getAdminAccess, requireAdmin } from "@/lib/auth";
import { updateStoreSettings } from "@/lib/actions/settings";
import ActionForm, { SubmitButton } from "@/components/admin/ActionForm";
import DemoResetForm from "@/components/admin/DemoResetForm";

export default async function AdminSettingsPage() {
  // Avant toute lecture en base — voir lib/auth.ts.
  await requireAdmin("parametres");
  // Le formatage est réservé au propriétaire (vérifié aussi dans l'action).
  const { isOwner } = await getAdminAccess();
  const settings = await getStoreSettings();

  return (
    <div>
      <h1 className="font-display text-2xl uppercase text-paper">Paramètres</h1>
      <p className="mt-2 max-w-lg text-xs text-paper/60">
        Ces valeurs sont utilisées directement par le site (seuil de livraison offerte affiché au
        paiement, coordonnées de contact affichées aux clients).
      </p>

      {!settings ? (
        <p className="mt-4 border border-paper/30 bg-paper/5 px-4 py-3 text-xs text-paper">
          Base de données indisponible.
        </p>
      ) : (
        <ActionForm action={updateStoreSettings} className="mt-8 flex max-w-md flex-col gap-6">
          <div>
            <p className="mb-4 border-b border-line pb-2 text-xs uppercase tracking-widest2 text-paper/70">
              Livraison
            </p>
            <p className="text-xs text-paper/60">
              Les frais de livraison varient selon la destination — communiqués directement au client
              par message, pas de montant fixe ici.
            </p>
            <label className="mt-4 block">
              <span className="mb-2 block text-xs uppercase tracking-widest2 text-paper/70">
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
            <p className="mb-4 border-b border-line pb-2 text-xs uppercase tracking-widest2 text-paper/70">
              Contact
            </p>
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-widest2 text-paper/70">Email de contact</span>
              <input
                name="contactEmail"
                type="email"
                defaultValue={settings.contactEmail ?? ""}
                placeholder="ekipjeuneriche@gmail.com"
                className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/50"
              />
            </label>
            <label className="mt-4 block">
              <span className="mb-2 block text-xs uppercase tracking-widest2 text-paper/70">Téléphone / WhatsApp</span>
              <input
                name="contactPhone"
                defaultValue={settings.contactPhone ?? ""}
                placeholder="+225 07 00 59 05 04"
                className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/50"
              />
            </label>
          </div>

          <SubmitButton
            pendingLabel="Enregistrement…"
            className="w-fit bg-paper px-6 py-3 text-xs uppercase tracking-widest2 text-ink"
          >
            Enregistrer
          </SubmitButton>
        </ActionForm>
      )}

      {isOwner && (
      <section className="mt-16 max-w-md border-t border-line pt-8">
        <p className="text-xs uppercase tracking-widest2 text-paper/70">Mode démo — formater les données</p>
        <p className="mt-2 text-xs text-paper/60">
          Remet la boutique à zéro avant une démonstration : choisissez ce qui doit être effacé. Les comptes
          administrateurs, les catégories et les paramètres ci-dessus ne sont jamais touchés.{" "}
          <strong className="text-paper/70">Action définitive, sans retour possible.</strong>
        </p>
        <div className="mt-6">
          <DemoResetForm />
        </div>
      </section>
      )}
    </div>
  );
}
