import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUS_LABEL, REVIEW_STATUS_LABEL } from "@/lib/adminLabels";

export default async function AdminClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Avant toute lecture en base — voir lib/auth.ts.
  await requireAdmin("clients");
  const { id } = await params;
  const client = await prisma.user.findUnique({
    where: { id },
    include: {
      orders: { orderBy: { createdAt: "desc" }, include: { items: true } },
      reviews: { include: { product: true }, orderBy: { createdAt: "desc" } },
      wishlist: { include: { product: true } },
    },
  });
  if (!client) notFound();

  const spent = client.orders
    .filter((o) => o.status !== "ANNULEE")
    .reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <div className="max-w-2xl">
      <Link href="/admin/clients" className="text-xs uppercase tracking-widest2 text-paper/60 hover:text-paper">
        ← Clients
      </Link>
      <h1 className="mt-3 font-display text-2xl uppercase text-paper">{client.name ?? client.email}</h1>
      <p className="mt-1 text-sm text-paper/60">{client.email}</p>
      <p className="text-xs text-paper/60">Inscrit le {client.createdAt.toLocaleDateString("fr-FR")}</p>

      <div className="mt-8 grid grid-cols-3 gap-4 border-y border-line py-6">
        <div>
          <p className="text-[11px] uppercase tracking-widest2 text-paper/60">Commandes</p>
          <p className="mt-1 text-lg text-paper">{client.orders.length}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-widest2 text-paper/60">Total dépensé</p>
          <p className="mt-1 text-lg text-paper">{formatPrice(spent)}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-widest2 text-paper/60">Favoris</p>
          <p className="mt-1 text-lg text-paper">{client.wishlist.length}</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xs uppercase tracking-widest2 text-paper/70">Historique des commandes</h2>
        {client.orders.length === 0 ? (
          <p className="mt-3 text-sm text-paper/60">Aucune commande.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {client.orders.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <Link href={`/admin/commandes/${o.id}`} className="text-paper hover:underline">
                    {o.orderNumber}
                  </Link>
                  <p className="text-xs text-paper/60">
                    {o.createdAt.toLocaleDateString("fr-FR")} · {o.items.length} article(s)
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-paper/70">{formatPrice(Number(o.total))}</p>
                  <p className="text-[11px] uppercase tracking-widest2 text-paper/60">{ORDER_STATUS_LABEL[o.status]}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {client.reviews.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xs uppercase tracking-widest2 text-paper/70">Avis laissés</h2>
          <ul className="mt-3 divide-y divide-line">
            {client.reviews.map((r) => (
              <li key={r.id} className="py-3 text-sm">
                <p className="text-paper">
                  {r.product.name} — {r.rating}/5 · <span className="text-paper/60">{REVIEW_STATUS_LABEL[r.status]}</span>
                </p>
                <p className="mt-1 text-paper/60">{r.comment}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
