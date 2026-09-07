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
    const recentOrders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { items: true },
    });
    return {
      orderCount,
      productCount,
      customerCount,
      lowStock,
      revenue: revenue._sum.total ? Number(revenue._sum.total) : 0,
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
      recentOrders: [] as Awaited<ReturnType<typeof prisma.order.findMany>>,
      available: false,
    };
  }
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    { label: "Chiffre d'affaires", value: formatPrice(stats.revenue), href: "/admin/commandes" },
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

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">
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

      <div className="mt-10">
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
  );
}
