import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createDrop } from "@/lib/actions/drops";
import ActionForm, { SubmitButton } from "@/components/admin/ActionForm";
import { DROP_STATUS_LABEL } from "@/lib/adminLabels";

export default async function AdminDropsPage() {
  // Avant toute lecture en base — voir lib/auth.ts.
  await requireAdmin();
  let drops: Awaited<ReturnType<typeof load>> = [];
  let available = true;
  try {
    drops = await load();
  } catch (err) {
    console.error("[admin/drops]", err);
    available = false;
  }

  return (
    <div>
      <h1 className="font-display text-2xl uppercase text-paper">Drops</h1>

      {!available && (
        <p className="mt-4 border border-paper/30 bg-paper/5 px-4 py-3 text-xs text-paper">
          Base de données indisponible.
        </p>
      )}

      {available && (
        <ul className="mt-8 divide-y divide-line">
          {drops.length === 0 && <p className="py-4 text-sm text-paper/40">Aucun drop actuellement.</p>}
          {drops.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 py-4">
              <Link href={`/admin/drops/${d.id}`} className="group min-w-0">
                <p className="text-sm text-paper group-hover:underline">{d.name}</p>
                <p className="text-xs text-paper/40">
                  {d.startsAt.toLocaleDateString("fr-FR")}
                  {d.endsAt ? ` → ${d.endsAt.toLocaleDateString("fr-FR")}` : ""} · {d.products.length} produit(s)
                </p>
              </Link>
              <span className="shrink-0 border border-line px-2 py-1 text-[10px] uppercase tracking-widest2 text-paper/70">
                {DROP_STATUS_LABEL[d.status]}
              </span>
            </li>
          ))}
        </ul>
      )}

      <ActionForm action={createDrop} resetOnSuccess className="mt-10 flex max-w-md flex-col gap-4 border-t border-line pt-8">
        <p className="text-xs uppercase tracking-widest2 text-paper/50">Créer un drop</p>
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-widest2 text-paper/40">Nom</span>
          <input
            name="name"
            required
            placeholder="Nom"
            className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/30"
          />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-widest2 text-paper/40">Début</span>
            <input
              name="startsAt"
              type="datetime-local"
              required
              className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-widest2 text-paper/40">
              Fin (optionnelle)
            </span>
            <input
              name="endsAt"
              type="datetime-local"
              className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper"
            />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-widest2 text-paper/40">Description</span>
          <textarea
            name="description"
            rows={3}
            placeholder="Description"
            className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/30"
          />
        </label>
        <SubmitButton className="w-fit bg-paper px-6 py-3 text-xs uppercase tracking-widest2 text-ink">Créer</SubmitButton>
        <p className="text-[11px] text-paper/30">
          Statut initial déterminé automatiquement selon la date de début (à ajuster ensuite si besoin).
        </p>
      </ActionForm>
    </div>
  );
}

function load() {
  return prisma.drop.findMany({ include: { products: true }, orderBy: { startsAt: "asc" } });
}
