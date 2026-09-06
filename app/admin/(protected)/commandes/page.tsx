import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  NOUVELLE: "Nouvelle",
  CONFIRMEE: "Confirmée",
  PREPARATION: "Préparation",
  EXPEDIEE: "Expédiée",
  LIVREE: "Livrée",
  ANNULEE: "Annulée",
};

export default async function AdminOrdersPage() {
  let orders: Awaited<ReturnType<typeof load>> = [];
  let available = true;
  try {
    orders = await load();
  } catch {
    available = false;
  }

  return (
    <div>
      <h1 className="font-display text-2xl uppercase text-paper">Commandes</h1>

      {!available && (
        <p className="mt-4 border border-paper/30 bg-paper/5 px-4 py-3 text-xs text-paper">
          Base de données indisponible.
        </p>
      )}

      {available && orders.length === 0 ? (
        <p className="mt-8 text-sm text-paper/40">Aucune commande pour le moment.</p>
      ) : (
        <table className="mt-8 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-widest2 text-paper/40">
              <th className="py-2">Référence</th>
              <th className="py-2">Client</th>
              <th className="py-2">Articles</th>
              <th className="py-2">Total</th>
              <th className="py-2">Statut</th>
              <th className="py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-line/50">
                <td className="py-3">
                  <Link href={`/admin/commandes/${o.id}`} className="text-paper hover:underline">
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="py-3 text-paper/60">{o.customerName}</td>
                <td className="py-3 text-paper/60">{o.items.length}</td>
                <td className="py-3 text-paper/60">{formatPrice(Number(o.total))}</td>
                <td className="py-3">
                  <span className="border border-line px-2 py-1 text-[10px] uppercase tracking-widest2 text-paper/70">
                    {STATUS_LABEL[o.status]}
                  </span>
                </td>
                <td className="py-3 text-paper/40">{o.createdAt.toLocaleDateString("fr-FR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function load() {
  return prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
}
