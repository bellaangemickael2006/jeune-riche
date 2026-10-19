import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMovements } from "@/lib/stock/movements";
import { compareSizes } from "@/lib/stock/labels";
import StockHistory from "@/components/admin/StockHistory";
import { cn, LOW_STOCK_THRESHOLD } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Vue d'ensemble : stock par produit (ruptures et stock faible en tête) et
// derniers mouvements tous produits confondus.
export default async function AdminStockPage({ searchParams }: { searchParams: Promise<{ filtre?: string }> }) {
  await requireAdmin("produits");
  const { filtre } = await searchParams;
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      published: true,
      variants: { select: { id: true, color: true, size: true, stock: true } },
    },
    orderBy: { name: "asc" },
  });
  const movements = await getMovements({ take: 80 });

  const rows = products
    .map((p) => {
      const total = p.variants.reduce((sum, v) => sum + v.stock, 0);
      const out = p.variants.filter((v) => v.stock <= 0).length;
      const low = p.variants.filter((v) => v.stock > 0 && v.stock <= LOW_STOCK_THRESHOLD).length;
      return { ...p, total, out, low };
    })
    .filter((p) => (filtre === "alertes" ? p.out > 0 || p.low > 0 : true))
    // Les produits qui demandent une action d'abord.
    .sort((a, b) => b.out + b.low - (a.out + a.low) || a.name.localeCompare(b.name, "fr"));

  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-2xl uppercase text-paper">Stock</h1>
      <div className="mt-6 flex gap-2">
        {[
          [undefined, "Tous les produits"],
          ["alertes", "Ruptures et stock faible"],
        ].map(([value, label]) => (
          <Link
            key={label}
            href={value ? `/admin/stock?filtre=${value}` : "/admin/stock"}
            className={cn(
              "border px-3 py-1.5 text-[10px] uppercase tracking-widest2",
              filtre === value ? "border-paper bg-paper text-ink" : "border-line text-paper/60 hover:text-paper"
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="mt-8 text-sm text-paper/40">{filtre ? "Aucune alerte de stock." : "Aucun produit."}</p>
      ) : (
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {rows.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 py-4">
              <div className="min-w-48 flex-1">
                <Link href={`/admin/produits/${p.id}/stock`} className="text-sm text-paper hover:underline">
                  {p.name}
                </Link>
                {!p.published && <span className="ml-2 text-[10px] uppercase tracking-widest2 text-paper/30">Brouillon</span>}
                <p className="mt-1 flex flex-wrap gap-1.5">
                  {[...p.variants]
                    .sort((a, b) => a.color.localeCompare(b.color, "fr") || compareSizes(a.size, b.size))
                    .map((v) => (
                      <span
                        key={v.id}
                        title={`${v.color} / ${v.size} : ${v.stock}`}
                        className={cn(
                          "border px-1.5 py-0.5 text-[10px]",
                          v.stock <= 0
                            ? "border-paper bg-paper text-ink"
                            : v.stock <= LOW_STOCK_THRESHOLD
                              ? "border-paper text-paper"
                              : "border-line text-paper/50"
                        )}
                      >
                        {v.color.slice(0, 3)} {v.size} · {v.stock}
                      </span>
                    ))}
                </p>
              </div>
              <div className="text-right text-xs text-paper/60">
                <p className="text-sm text-paper">{p.total} pièces</p>
                {(p.out > 0 || p.low > 0) && (
                  <p>
                    {p.out > 0 && `${p.out} en rupture`}
                    {p.out > 0 && p.low > 0 && " · "}
                    {p.low > 0 && `${p.low} faible${p.low > 1 ? "s" : ""}`}
                  </p>
                )}
              </div>
              <Link
                href={`/admin/produits/${p.id}/stock`}
                className="border border-line px-3 py-1.5 text-[10px] uppercase tracking-widest2 text-paper hover:border-paper"
              >
                Modifier
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section className="mt-12">
        <h2 className="text-xs uppercase tracking-widest2 text-paper/50">Derniers mouvements</h2>
        <StockHistory movements={movements} showProduct />
      </section>
    </div>
  );
}
