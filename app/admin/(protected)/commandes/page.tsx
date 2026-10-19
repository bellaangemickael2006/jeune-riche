import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice, cn } from "@/lib/utils";
import { ORDER_STATUSES as STATUSES, ordersWhere } from "@/lib/admin/filters";

const STATUS_LABEL: Record<string, string> = {
  NOUVELLE: "Nouvelle",
  CONFIRMEE: "Confirmée",
  PREPARATION: "Préparation",
  EXPEDIEE: "Expédiée",
  LIVREE: "Livrée",
  ANNULEE: "Annulée",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; statut?: string }>;
}) {
  // Avant toute lecture en base — voir lib/auth.ts.
  await requireAdmin();
  const { q, statut } = await searchParams;
  let orders: Awaited<ReturnType<typeof load>> = [];
  let available = true;
  try {
    orders = await load(q, statut);
  } catch (err) {
    console.error("[admin/commandes]", err);
    available = false;
  }

  function filterHref(nextStatut?: string) {
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (nextStatut) qs.set("statut", nextStatut);
    const s = qs.toString();
    return s ? `/admin/commandes?${s}` : "/admin/commandes";
  }

  return (
    <div>
      <h1 className="font-display text-2xl uppercase text-paper">Commandes</h1>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form className="max-w-xs flex-1">
          {statut && <input type="hidden" name="statut" value={statut} />}
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Référence, nom ou email…"
            className="w-full border border-line bg-transparent px-4 py-2 text-sm text-paper placeholder:text-paper/30"
          />
        </form>
        <div className="flex flex-wrap gap-2">
          <Link
            href={filterHref(undefined)}
            className={cn(
              "border px-3 py-1.5 text-[10px] uppercase tracking-widest2",
              !statut ? "border-paper bg-paper text-ink" : "border-line text-paper/60 hover:text-paper"
            )}
          >
            Toutes
          </Link>
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={filterHref(s)}
              className={cn(
                "border px-3 py-1.5 text-[10px] uppercase tracking-widest2",
                statut === s ? "border-paper bg-paper text-ink" : "border-line text-paper/60 hover:text-paper"
              )}
            >
              {STATUS_LABEL[s]}
            </Link>
          ))}
        </div>
      </div>

      {/* Export CSV : mêmes filtres que la liste, période facultative. */}
      <form action="/admin/export/commandes" className="mt-4 flex flex-wrap items-end gap-3 text-xs">
        {q && <input type="hidden" name="q" value={q} />}
        {statut && <input type="hidden" name="statut" value={statut} />}
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-widest2 text-paper/40">Du</span>
          <input type="date" name="du" className="border border-line bg-transparent px-2 py-1.5 text-paper [color-scheme:dark]" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-widest2 text-paper/40">Au</span>
          <input type="date" name="au" className="border border-line bg-transparent px-2 py-1.5 text-paper [color-scheme:dark]" />
        </label>
        <button type="submit" className="border border-paper px-4 py-2 text-[10px] uppercase tracking-widest2 text-paper hover:bg-paper hover:text-ink">
          Exporter en CSV
        </button>
        {/* Même formulaire, autre destination : les bons de l'atelier. */}
        <button
          type="submit"
          formAction="/admin/bons"
          formTarget="_blank"
          className="border border-line px-4 py-2 text-[10px] uppercase tracking-widest2 text-paper/80 hover:border-paper hover:text-paper"
        >
          Imprimer les bons
        </button>
        <span className="text-[11px] text-paper/35">
          {statut || q ? "Avec les filtres affichés ci-dessus." : "Toutes les commandes (ou la période choisie)."}
        </span>
      </form>

      {!available && (
        <p className="mt-4 border border-paper/30 bg-paper/5 px-4 py-3 text-xs text-paper">
          Base de données indisponible.
        </p>
      )}

      {available && orders.length === 0 ? (
        <p className="mt-8 text-sm text-paper/40">Aucune commande trouvée.</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-widest2 text-paper/40">
              <th className="py-2">Référence</th>
              <th className="py-2">Client</th>
              <th className="py-2">WhatsApp</th>
              <th className="py-2">Articles</th>
              <th className="py-2">Total</th>
              <th className="py-2">Statut</th>
              <th className="py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const phone = (o.shippingAddress as { phone?: string } | null)?.phone;
              return (
                <tr key={o.id} className="border-b border-line/50">
                  <td className="py-3">
                    <Link href={`/admin/commandes/${o.id}`} className="text-paper hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="py-3 text-paper/60">{o.customerName}</td>
                  <td className="py-3 text-paper/60">{phone || "—"}</td>
                  <td className="py-3 text-paper/60">{o.items.length}</td>
                  <td className="py-3 text-paper/60">{formatPrice(Number(o.total))}</td>
                  <td className="py-3">
                    <span className="border border-line px-2 py-1 text-[10px] uppercase tracking-widest2 text-paper/70">
                      {STATUS_LABEL[o.status]}
                    </span>
                  </td>
                  <td className="py-3 text-paper/40">{o.createdAt.toLocaleDateString("fr-FR")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}

function load(q?: string, statut?: string) {
  return prisma.order.findMany({
    where: ordersWhere({ q, statut }),
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
}
