import Link from "next/link";
import { getAdminAccess } from "@/lib/auth";
import { canSeeLink, hasPermission, PERMISSIONS, type Permission } from "@/lib/admin/permissions";
import { prisma } from "@/lib/prisma";
import { cn, formatPrice, LOW_STOCK_THRESHOLD } from "@/lib/utils";
import { ORDER_STATUS_LABEL as STATUS_LABEL } from "@/lib/adminLabels";
import SalesChart from "@/components/admin/SalesChart";
import {
  cartFunnel,
  dailySeries,
  parsePeriod,
  PERIODS,
  startOfDayUTC,
  topPieces,
  trend,
  type Period,
} from "@/lib/orders/stats";

// Toujours calculé à la demande : un tableau de bord mis en cache afficherait
// d'anciens chiffres juste après une commande ou un formatage démo.
export const dynamic = "force-dynamic";

const PAID = { status: { not: "ANNULEE" as const } };

async function getStats(period: Period) {
  try {
    const since = startOfDayUTC(period - 1);
    const previousSince = startOfDayUTC(period * 2 - 1);

    // Séquentiel plutôt que Promise.all : avec un pooler à capacité limitée
    // (voir lib/prisma.ts), plusieurs requêtes lancées en parallèle depuis la
    // même instance peuvent se retrouver à attendre une connexion libre.
    const orderCount = await prisma.order.count();
    const productCount = await prisma.product.count({ where: { published: true } });
    const customerCount = await prisma.user.count({ where: { role: "CLIENT" } });
    const lowStock = await prisma.productVariant.count({
      where: { stock: { lte: LOW_STOCK_THRESHOLD, gt: 0 }, product: { published: true } },
    });
    const revenue = await prisma.order.aggregate({ _sum: { total: true }, _count: true, where: PAID });
    const revenueToday = await prisma.order.aggregate({
      _sum: { total: true },
      where: { ...PAID, createdAt: { gte: startOfDayUTC(0) } },
    });

    const periodOrders = await prisma.order.findMany({
      where: { ...PAID, createdAt: { gte: since } },
      select: { createdAt: true, total: true },
    });
    const previousRevenue = await prisma.order.aggregate({
      _sum: { total: true },
      where: { ...PAID, createdAt: { gte: previousSince, lt: since } },
    });
    // Regroupé sur le nom figé au moment de la commande (order_items.productName)
    // plutôt que sur le produit vivant : un produit renommé ou supprimé depuis
    // ne doit pas casser le classement des ventes passées.
    const periodItems = await prisma.orderItem.findMany({
      where: { order: { ...PAID, createdAt: { gte: since } } },
      select: { productName: true, quantity: true, unitPrice: true },
    });
    const carts = await prisma.abandonedCart.findMany({
      where: { createdAt: { gte: since } },
      select: { remindedAt: true, convertedAt: true },
    });
    const statusCounts = await prisma.order.groupBy({
      by: ["status"],
      _count: true,
      where: { createdAt: { gte: since } },
    });
    const recentOrders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { items: true },
    });

    const series = dailySeries(
      periodOrders.map((o) => ({ createdAt: o.createdAt, total: Number(o.total) })),
      period
    );
    const periodRevenue = series.reduce((sum, d) => sum + d.revenue, 0);
    const totalRevenue = revenue._sum.total ? Number(revenue._sum.total) : 0;

    return {
      available: true as const,
      orderCount,
      productCount,
      customerCount,
      lowStock,
      revenue: totalRevenue,
      revenueToday: revenueToday._sum.total ? Number(revenueToday._sum.total) : 0,
      periodRevenue,
      periodOrders: periodOrders.length,
      periodTrend: trend(periodRevenue, previousRevenue._sum.total ? Number(previousRevenue._sum.total) : 0),
      // Le panier moyen se calcule sur les commandes comptées dans le chiffre
      // d'affaires : diviser par toutes les commandes, annulées comprises, le
      // sous-estimait.
      averageOrderValue: revenue._count > 0 ? totalRevenue / revenue._count : 0,
      series,
      topProducts: topPieces(periodItems.map((i) => ({ ...i, unitPrice: Number(i.unitPrice) }))),
      funnel: cartFunnel(carts),
      statusCounts: statusCounts.map((s) => ({ status: s.status, count: s._count })),
      recentOrders,
    };
  } catch (err) {
    console.error("[admin/dashboard]", err);
    return { available: false as const };
  }
}

function percent(value: number) {
  return new Intl.NumberFormat("fr", { style: "percent", maximumFractionDigits: 0 }).format(value);
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string; acces?: string; section?: string }>;
}) {
  // Avant toute lecture en base — voir lib/auth.ts.
  const { user, permissions } = await getAdminAccess();
  const params = await searchParams;
  const refused =
    params.acces === "refuse"
      ? params.section === "proprietaire"
        ? "Cette section est réservée au propriétaire de la boutique."
        : `Vous n'avez pas accès à la section « ${PERMISSIONS[params.section as Permission]?.label ?? "demandée"} ». Demandez-le au propriétaire.`
      : null;

  // Employé sans le droit « statistiques » : accueil simple, sans aucun chiffre.
  if (!hasPermission(permissions, "statistiques")) {
    const shortcuts = [
      ["/admin/commandes", "Commandes"],
      ["/admin/produits", "Produits"],
      ["/admin/stock", "Stock"],
      ["/admin/clients", "Clients"],
      ["/admin/avis", "Avis"],
      ["/admin/codes-promo", "Codes promo"],
      ["/admin/newsletter", "Newsletter"],
      ["/admin/accueil", "Page d'accueil"],
      ["/admin/parametres", "Paramètres"],
    ].filter(([href]) => canSeeLink(permissions, href));
    return (
      <div>
        <h1 className="font-display text-2xl uppercase text-paper">Bonjour{user.name ? ` ${user.name}` : ""}</h1>
        {refused && <p className="mt-4 border border-paper/30 bg-paper/5 px-4 py-3 text-xs text-paper">{refused}</p>}
        <p className="mt-4 text-sm text-paper/50">Vos accès :</p>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {shortcuts.map(([href, label]) => (
            <Link key={href} href={href} className="border border-line p-5 text-sm uppercase tracking-widest2 text-paper hover:border-paper/40">
              {label}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const period = parsePeriod(params.periode);
  const stats = await getStats(period);

  if (!stats.available) {
    return (
      <div>
        <h1 className="font-display text-2xl uppercase text-paper">Dashboard</h1>
        <p className="mt-3 border border-paper/30 bg-paper/5 px-4 py-3 text-xs text-paper">
          Base de données indisponible — vérifiez DATABASE_URL.
        </p>
      </div>
    );
  }

  const cards = [
    { label: "Aujourd'hui", value: formatPrice(stats.revenueToday), href: "/admin/commandes" },
    { label: "Chiffre d'affaires total", value: formatPrice(stats.revenue), href: "/admin/commandes" },
    { label: "Panier moyen", value: formatPrice(stats.averageOrderValue), href: "/admin/commandes" },
    { label: "Commandes", value: stats.orderCount, href: "/admin/commandes" },
    { label: "Produits publiés", value: stats.productCount, href: "/admin/produits" },
    { label: "Clients", value: stats.customerCount, href: "/admin/clients" },
    { label: `Stock faible (≤${LOW_STOCK_THRESHOLD})`, value: stats.lowStock, href: "/admin/produits?stock=faible" },
    { label: "Taux de conversion paniers", value: percent(stats.funnel.rate), href: "#conversion" },
  ];
  const maxTopQty = Math.max(...stats.topProducts.map((p) => p.quantity), 1);
  const statusTotal = stats.statusCounts.reduce((sum, s) => sum + s.count, 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-2xl uppercase text-paper">Dashboard</h1>
        {refused && <p className="w-full border border-paper/30 bg-paper/5 px-4 py-3 text-xs text-paper">{refused}</p>}
        <nav aria-label="Période" className="flex gap-2">
          {PERIODS.map((p) => (
            <Link
              key={p}
              href={`/admin?periode=${p}`}
              aria-current={p === period ? "page" : undefined}
              className={cn(
                "border px-3 py-1.5 text-[10px] uppercase tracking-widest2",
                p === period ? "border-paper bg-paper text-ink" : "border-line text-paper/60 hover:text-paper"
              )}
            >
              {p} jours
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="border border-line p-5 transition-colors hover:border-paper/40">
            <p className="text-[10px] uppercase tracking-widest2 text-paper/40">{card.label}</p>
            <p className="mt-2 font-display text-2xl text-paper">{card.value}</p>
          </Link>
        ))}
      </div>

      <section className="mt-10 border border-line p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-xs uppercase tracking-widest2 text-paper/50">Ventes par jour — {period} jours</h2>
          <p className="text-sm text-paper">
            {formatPrice(stats.periodRevenue)}
            <span className="text-paper/40"> · {stats.periodOrders} commande{stats.periodOrders > 1 ? "s" : ""}</span>
            {stats.periodTrend !== null && (
              <span className={cn("ml-2 text-xs", stats.periodTrend >= 0 ? "text-paper" : "text-paper/50")}>
                {stats.periodTrend >= 0 ? "▲" : "▼"} {percent(Math.abs(stats.periodTrend))} vs période précédente
              </span>
            )}
          </p>
        </div>
        <div className="mt-5">
          <SalesChart series={stats.series} />
        </div>
      </section>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <section>
          <h2 className="text-xs uppercase tracking-widest2 text-paper/50">Meilleures pièces — {period} jours</h2>
          {stats.topProducts.length === 0 ? (
            <p className="mt-3 text-sm text-paper/40">Pas encore de vente sur la période.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {stats.topProducts.map((p, i) => (
                <li key={p.name} className="text-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-paper">
                      <span className="text-paper/40">{i + 1}.</span> {p.name}
                    </span>
                    <span className="shrink-0 text-paper/60">
                      {p.quantity} vendu{p.quantity > 1 ? "s" : ""} · {formatPrice(p.revenue)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 bg-line">
                    <div className="h-full bg-paper" style={{ width: `${(p.quantity / maxTopQty) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="conversion">
          <h2 className="text-xs uppercase tracking-widest2 text-paper/50">Conversion des paniers — {period} jours</h2>
          {stats.funnel.started === 0 ? (
            <p className="mt-3 text-sm text-paper/40">
              Aucun panier commencé sur la période (un panier est compté dès que l&apos;email est saisi au checkout).
            </p>
          ) : (
            <>
              <p className="mt-3 font-display text-4xl text-paper">{percent(stats.funnel.rate)}</p>
              <p className="text-xs text-paper/40">des paniers commencés deviennent une commande</p>
              <dl className="mt-5 space-y-3 text-sm">
                {[
                  { label: "Paniers commencés", value: stats.funnel.started },
                  { label: "Devenus commandes", value: stats.funnel.converted },
                  { label: "Relancés par email", value: stats.funnel.reminded },
                  { label: "Récupérés après relance", value: stats.funnel.recovered },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex justify-between">
                      <dt className="text-paper/60">{row.label}</dt>
                      <dd className="text-paper">{row.value}</dd>
                    </div>
                    <div className="mt-1.5 h-1 bg-line">
                      <div className="h-full bg-paper" style={{ width: `${(row.value / stats.funnel.started) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </dl>
            </>
          )}
        </section>
      </div>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <section>
          <h2 className="text-xs uppercase tracking-widest2 text-paper/50">Statut des commandes — {period} jours</h2>
          {statusTotal === 0 ? (
            <p className="mt-3 text-sm text-paper/40">Aucune commande sur la période.</p>
          ) : (
            <>
              <div className="mt-4 flex h-2 overflow-hidden bg-line">
                {stats.statusCounts.map((s, i) => (
                  <div
                    key={s.status}
                    title={`${STATUS_LABEL[s.status] ?? s.status} : ${s.count}`}
                    className="h-full bg-paper"
                    style={{ width: `${(s.count / statusTotal) * 100}%`, opacity: 1 - i * 0.14 }}
                  />
                ))}
              </div>
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-paper/60">
                {stats.statusCounts.map((s) => (
                  <li key={s.status}>
                    {STATUS_LABEL[s.status] ?? s.status} <span className="text-paper">{s.count}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section>
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
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-3 text-sm">
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
        </section>
      </div>
    </div>
  );
}
