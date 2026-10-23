import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatPrice, cn } from "@/lib/utils";
import { createPromoCode, togglePromoCode, deletePromoCode } from "@/lib/actions/promoCodes";
import ConfirmButton from "@/components/admin/ConfirmButton";
import ActionForm, { SubmitButton } from "@/components/admin/ActionForm";

export default async function AdminPromoCodesPage() {
  // Avant toute lecture en base — voir lib/auth.ts.
  await requireAdmin("promos");
  let codes: Awaited<ReturnType<typeof load>> = [];
  let available = true;
  // Heure de référence pour « expiré », lue une fois au chargement de la liste.
  let now = 0;
  try {
    codes = await load();
    now = loadedAt();
  } catch (err) {
    console.error("[admin/codes-promo]", err);
    available = false;
  }

  return (
    <div>
      <h1 className="font-display text-2xl uppercase text-paper">Codes promo</h1>

      {!available && (
        <p className="mt-4 border border-paper/30 bg-paper/5 px-4 py-3 text-xs text-paper">
          Base de données indisponible.
        </p>
      )}

      {available && (
        <ul className="mt-8 divide-y divide-line">
          {codes.length === 0 && <p className="py-4 text-sm text-paper/60">Aucun code promo pour le moment.</p>}
          {codes.map((c) => {
            const expired = c.expiresAt ? c.expiresAt.getTime() < now : false;
            const exhausted = c.maxUses !== null && c.usedCount >= c.maxUses;
            return (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="font-display text-sm uppercase text-paper">{c.code}</p>
                  <p className="text-xs text-paper/60">
                    {c.type === "PERCENT" ? `-${Number(c.value)}%` : `-${formatPrice(Number(c.value))}`}
                    {c.minSubtotal ? ` · dès ${formatPrice(Number(c.minSubtotal))}` : ""}
                    {c.maxUses ? ` · ${c.usedCount}/${c.maxUses} utilisations` : ` · ${c.usedCount} utilisation${c.usedCount > 1 ? "s" : ""}`}
                    {c.expiresAt ? ` · expire le ${c.expiresAt.toLocaleDateString("fr-FR")}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={cn(
                      "border px-2 py-1 text-[11px] uppercase tracking-widest2",
                      c.active && !expired && !exhausted
                        ? "border-paper/40 text-paper"
                        : "border-line text-paper/60"
                    )}
                  >
                    {expired ? "Expiré" : exhausted ? "Épuisé" : c.active ? "Actif" : "Désactivé"}
                  </span>
                  <ActionForm action={togglePromoCode.bind(null, c.id, !c.active)}>
                    <SubmitButton className="text-[11px] uppercase tracking-widest2 text-paper/70 hover:text-paper">
                      {c.active ? "Désactiver" : "Activer"}
                    </SubmitButton>
                  </ActionForm>
                  <ActionForm action={deletePromoCode.bind(null, c.id)}>
                    <ConfirmButton
                      confirmMessage={`Supprimer le code "${c.code}" ?`}
                      className="text-[11px] uppercase tracking-widest2 text-paper/60 hover:text-paper"
                    >
                      Supprimer
                    </ConfirmButton>
                  </ActionForm>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ActionForm action={createPromoCode} resetOnSuccess className="mt-10 flex max-w-md flex-col gap-4 border-t border-line pt-8">
        <p className="text-xs uppercase tracking-widest2 text-paper/70">Créer un code</p>
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-widest2 text-paper/60">Code</span>
          <input
            name="code"
            required
            placeholder="Ex. BIENVENUE10"
            className="w-full border border-line bg-transparent px-4 py-3 text-sm uppercase text-paper placeholder:text-paper/50 placeholder:normal-case"
          />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-widest2 text-paper/60">Type</span>
            <select name="type" className="w-full border border-line bg-ink px-4 py-3 text-sm text-paper">
              <option value="PERCENT" className="bg-ink">Pourcentage</option>
              <option value="FIXED" className="bg-ink">Montant fixe (F CFA)</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-widest2 text-paper/60">Valeur</span>
            <input
              name="value"
              type="number"
              min="1"
              step="1"
              required
              placeholder="10"
              className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/50"
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-widest2 text-paper/60">
              Panier minimum (optionnel)
            </span>
            <input
              name="minSubtotal"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/50"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-widest2 text-paper/60">
              Utilisations max (optionnel)
            </span>
            <input
              name="maxUses"
              type="number"
              min="1"
              step="1"
              placeholder="Illimité"
              className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/50"
            />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-widest2 text-paper/60">
            Date d&apos;expiration (optionnelle)
          </span>
          <input
            name="expiresAt"
            type="date"
            className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper"
          />
        </label>
        <SubmitButton className="w-fit bg-paper px-6 py-3 text-xs uppercase tracking-widest2 text-ink">Créer</SubmitButton>
      </ActionForm>
    </div>
  );
}

function loadedAt() {
  return Date.now();
}

function load() {
  return prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });
}
