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

function startOfDay(daysAgo: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d;
}

async function getStats() {
  try {
    // Séquentiel plutôt que Promise.all : avec un pooler à capacité limitée
    // (voir lib/prisma.ts), plusieurs requêtes lancées en parallèle depuis la
    // même instance peuvent se retrouver à attendre une connexion libre.
    const orderCount = await prisma.order.count();
    const productCount = await prisma.product.count({ where: { published: true } });
    const customerCount = await prisma.user.count({ where: { role: "CLIENT" } });
    const lowStock = await prisma.productVariant.count({ where: { stock: { lte: 3, gt: 0 } } });
    const revenue = await prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { not: "ANNULEE" } },
    });
    const revenueToday = await prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { not: "ANNULEE" }, createdAt: { gte: startOfDay(0) } },
    });
    const revenue7d = await prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { not: "ANNULEE" }, createdAt: { gte: startOfDay(6) } },
    });
    // Regroupé sur le nom figé au moment de la commande (order_items.productName)
    // plutôt que sur le produit vivant : un produit renommé ou supprimé depuis
    // ne doit pas casser le classement des ventes passées.
    const topProductsRaw = await prisma.orderItem.groupBy({
      by: ["productName"],
      _sum: { quantity: true },
      where: { order: { status: { not: "ANNULEE" } } },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    });
    const topProducts = topProductsRaw.map((p) => ({
      name: p.productName,
      quantity: p._sum.quantity ?? 0,
    }));
    const recentOrders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { items: true },
    });
    const totalRevenue = revenue._sum.total ? Number(revenue._sum.total) : 0;
    return {
      orderCount,
      productCount,
      customerCount,
      lowStock,
      revenue: totalRevenue,
      revenueToday: revenueToday._sum.total ? Number(revenueToday._sum.total) : 0,
      revenue7d: revenue7d._sum.total ? Number(revenue7d._sum.total) : 0,
      averageOrderValue: orderCount > 0 ? totalRevenue / orderCount : 0,
      topProducts,
      recentOrders,
      available: true,
    };
  } catch {
    return {
      orderCount: 0,
      productCount: 0,
      customerCount: 0,
      lowStock: 0,
      revenue: 0,
      revenueToday: 0,
      revenue7d: 0,
      averageOrderValue: 0,
      topProducts: [] as { name: string; quantity: number }[],
      recentOrders: [] as Awaited<ReturnType<typeof prisma.order.findMany>>,
      available: false,
    };
  }
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    { label: "Aujourd'hui", value: formatPrice(stats.revenueToday), href: "/admin/commandes" },
    { label: "7 derniers jours", value: formatPrice(stats.revenue7d), href: "/admin/commandes" },
    { label: "Chiffre d'affaires total", value: formatPrice(stats.revenue), href: "/admin/commandes" },
    { label: "Panier moyen", value: formatPrice(stats.averageOrderValue), href: "/admin/commandes" },
    { label: "Commandes", value: stats.orderCount, href: "/admin/commandes" },
    { label: "Produits publiés", value: stats.productCount, href: "/admin/produits" },
    { label: "Clients", value: stats.customerCount, href: "/admin/clients" },
    { label: "Stock faible (≤3)", value: stats.lowStock, href: "/admin/produits?stock=faible" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl uppercase text-paper">Dashboard</h1>

      {!stats.available && (
        <p className="mt-3 border border-paper/30 bg-paper/5 px-4 py-3 text-xs text-paper">
          Base de données indisponible — vérifiez DATABASE_URL. Les chiffres ci-dessous sont à zéro
          par défaut.
        </p>
      )}

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="border border-line p-5 transition-colors hover:border-paper/40"
          >
            <p className="text-[10px] uppercase tracking-widest2 text-paper/40">{card.label}</p>
            <p className="mt-2 font-display text-2xl text-paper">{card.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="text-xs uppercase tracking-widest2 text-paper/50">Produits les plus vendus</h2>
          {stats.topProducts.length === 0 ? (
            <p className="mt-3 text-sm text-paper/40">Pas encore de vente.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {stats.topProducts.map((p, i) => (
                <li key={p.name} className="flex items-center justify-between py-3 text-sm">
                  <span className="text-paper/40">{i + 1}.</span>
                  <span className="flex-1 px-3 text-paper">{p.name}</span>
                  <span className="text-paper/60">{p.quantity} vendu{p.quantity > 1 ? "s" : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-widest2 text-paper/50">Commandes récentes</h2>
            <Link href="/admin/commandes" className="text-[10px] uppercase tracking-widest2 text-paper/40 hover:text-paper">
              Tout voir
            </Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <p className="mt-3 text-sm text-paper/40">Aucune commande pour le moment.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {stats.recentOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between py-3 text-sm">
                  <Link href={`/admin/commandes/${o.id}`} className="text-paper hover:underline">
                    {o.orderNumber}
                  </Link>
                  <span className="text-paper/50">{o.customerName}</span>
                  <span className="text-paper/60">{formatPrice(Number(o.total))}</span>
                  <span className="border border-line px-2 py-1 text-[10px] uppercase tracking-widest2 text-paper/70">
                    {STATUS_LABEL[o.status] ?? o.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
