import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

async function getStats() {
  try {
    const [orderCount, productCount, customerCount, lowStock, revenue] = await Promise.all([
      prisma.order.count(),
      prisma.product.count({ where: { published: true } }),
      prisma.user.count({ where: { role: "CLIENT" } }),
      prisma.productVariant.count({ where: { stock: { lte: 3, gt: 0 } } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: "ANNULEE" } } }),
    ]);
    return {
      orderCount,
      productCount,
      customerCount,
      lowStock,
      revenue: revenue._sum.total ? Number(revenue._sum.total) : 0,
      available: true,
    };
  } catch {
    return { orderCount: 0, productCount: 0, customerCount: 0, lowStock: 0, revenue: 0, available: false };
  }
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    { label: "Chiffre d'affaires", value: formatPrice(stats.revenue) },
    { label: "Commandes", value: stats.orderCount },
    { label: "Produits publiés", value: stats.productCount },
    { label: "Clients", value: stats.customerCount },
    { label: "Stock faible (≤3)", value: stats.lowStock },
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
          <div key={card.label} className="border border-line p-5">
            <p className="text-[10px] uppercase tracking-widest2 text-paper/40">{card.label}</p>
            <p className="mt-2 font-display text-2xl text-paper">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
