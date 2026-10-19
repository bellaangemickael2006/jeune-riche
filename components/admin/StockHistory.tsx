import Link from "next/link";
import { MOVEMENT_REASONS, type MovementReason } from "@/lib/stock/labels";
import type { getMovements } from "@/lib/stock/movements";

type Movements = NonNullable<Awaited<ReturnType<typeof getMovements>>>;

/** Historique des mouvements ; `showProduct` pour la vue tous produits. */
export default function StockHistory({ movements, showProduct }: { movements: Movements | null; showProduct?: boolean }) {
  if (movements === null) {
    return (
      <p className="mt-3 border border-paper/30 bg-paper/5 px-4 py-3 text-xs text-paper">
        Historique indisponible : appliquez la migration « add_stock_movements » dans Supabase. Le stock, lui,
        fonctionne normalement.
      </p>
    );
  }
  if (movements.length === 0) return <p className="mt-3 text-sm text-paper/40">Aucun mouvement enregistré pour le moment.</p>;

  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-[10px] uppercase tracking-widest2 text-paper/40">
            <th className="py-2">Date</th>
            {showProduct && <th className="py-2">Produit</th>}
            <th className="py-2">Variante</th>
            <th className="py-2 text-right">Mouvement</th>
            <th className="py-2 text-right">Stock après</th>
            <th className="py-2 pl-4">Motif</th>
            <th className="py-2">Par</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((m) => (
            <tr key={m.id} className="border-b border-line/50 align-top">
              <td className="py-2 text-paper/50">
                {m.createdAt.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Africa/Abidjan" })}
              </td>
              {showProduct && (
                <td className="py-2">
                  <Link href={`/admin/produits/${m.variant.product.id}/stock`} className="text-paper hover:underline">
                    {m.variant.product.name}
                  </Link>
                </td>
              )}
              <td className="py-2 text-paper/70">
                {m.variant.color} / {m.variant.size}
              </td>
              <td className={`py-2 text-right font-medium ${m.delta > 0 ? "text-paper" : "text-paper/60"}`}>
                {m.delta > 0 ? `+${m.delta}` : m.delta}
              </td>
              <td className="py-2 text-right text-paper/70">{m.stockAfter}</td>
              <td className="py-2 pl-4 text-paper/70">
                {MOVEMENT_REASONS[m.reason as MovementReason] ?? m.reason}
                {m.orderId ? (
                  <Link href={`/admin/commandes/${m.orderId}`} className="ml-1 text-paper/50 underline underline-offset-2 hover:text-paper">
                    {m.note ?? "commande"}
                  </Link>
                ) : (
                  m.note && <span className="block text-[11px] text-paper/40">{m.note}</span>
                )}
              </td>
              <td className="py-2 text-[11px] text-paper/40">{m.actorEmail ?? "Client"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
