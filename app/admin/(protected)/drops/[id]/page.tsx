import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  updateDrop,
  deleteDrop,
  assignProductToDrop,
  removeProductFromDrop,
} from "@/lib/actions/drops";
import type { DropStatus } from "@/lib/generated/prisma/client";
import ConfirmButton from "@/components/admin/ConfirmButton";
import ActionForm, { SubmitButton } from "@/components/admin/ActionForm";
import { DROP_STATUS_LABEL } from "@/lib/adminLabels";

const STATUSES: DropStatus[] = ["COMING_SOON", "PRE_ORDER", "AVAILABLE", "SOLD_OUT", "ENDED"];

function toLocalInputValue(date: Date | null) {
  if (!date) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default async function AdminDropDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Avant toute lecture en base — voir lib/auth.ts.
  await requireAdmin("produits");
  const { id } = await params;
  const drop = await prisma.drop.findUnique({ where: { id }, include: { products: true } });
  if (!drop) notFound();

  const availableProducts = await prisma.product.findMany({
    where: { dropId: null },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl">
      <Link href="/admin/drops" className="text-xs uppercase tracking-widest2 text-paper/60 hover:text-paper">
        ← Drops
      </Link>
      <h1 className="mt-3 font-display text-2xl uppercase text-paper">{drop.name}</h1>

      <ActionForm action={updateDrop.bind(null, drop.id)} className="mt-8 flex flex-col gap-4">
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-widest2 text-paper/70">Nom</span>
          <input
            name="name"
            defaultValue={drop.name}
            required
            className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper"
          />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-widest2 text-paper/70">Début</span>
            <input
              name="startsAt"
              type="datetime-local"
              defaultValue={toLocalInputValue(drop.startsAt)}
              required
              className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-widest2 text-paper/70">
              Fin (optionnelle)
            </span>
            <input
              name="endsAt"
              type="datetime-local"
              defaultValue={toLocalInputValue(drop.endsAt)}
              className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper"
            />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-widest2 text-paper/70">Description</span>
          <textarea
            name="description"
            rows={3}
            defaultValue={drop.description ?? ""}
            className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-widest2 text-paper/70">Statut</span>
          <select
            name="status"
            defaultValue={drop.status}
            className="w-full border border-line bg-ink px-4 py-3 text-sm text-paper"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s} className="bg-ink">
                {DROP_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <SubmitButton pendingLabel="Enregistrement…" className="w-fit bg-paper px-6 py-3 text-xs uppercase tracking-widest2 text-ink">
          Enregistrer
        </SubmitButton>
      </ActionForm>

      <div className="mt-10 border-t border-line pt-8">
        <h2 className="text-xs uppercase tracking-widest2 text-paper/70">Produits du drop</h2>
        {drop.products.length === 0 ? (
          <p className="mt-3 text-sm text-paper/60">Aucun produit assigné.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {drop.products.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <Link href={`/admin/produits/${p.id}`} className="min-w-0 text-paper hover:underline">
                  {p.name}
                </Link>
                <ActionForm action={removeProductFromDrop.bind(null, drop.id, p.id)} className="shrink-0">
                  <SubmitButton className="text-[11px] uppercase tracking-widest2 text-paper/60 hover:text-paper">
                    Retirer
                  </SubmitButton>
                </ActionForm>
              </li>
            ))}
          </ul>
        )}

        {availableProducts.length > 0 && (
          <ActionForm action={assignProductToDrop.bind(null, drop.id)} className="mt-5 flex flex-wrap gap-3">
            <select name="productId" required className="flex-1 border border-line bg-ink px-4 py-2 text-sm text-paper">
              <option value="" className="bg-ink">
                Ajouter un produit…
              </option>
              {availableProducts.map((p) => (
                <option key={p.id} value={p.id} className="bg-ink">
                  {p.name}
                </option>
              ))}
            </select>
            <SubmitButton className="border border-line px-4 py-2 text-xs uppercase tracking-widest2 text-paper/70 hover:border-paper hover:text-paper">
              Ajouter
            </SubmitButton>
          </ActionForm>
        )}
      </div>

      <ActionForm action={deleteDrop.bind(null, drop.id)} className="mt-10 border-t border-line pt-6">
        <ConfirmButton
          confirmMessage={`Supprimer le drop "${drop.name}" ? Les produits associés seront détachés, pas supprimés.`}
          className="text-xs uppercase tracking-widest2 text-paper/60 hover:text-paper"
        >
          Supprimer ce drop
        </ConfirmButton>
        <p className="mt-1 text-[11px] text-paper/60">Les produits associés ne sont pas supprimés, seulement détachés.</p>
      </ActionForm>
    </div>
  );
}
