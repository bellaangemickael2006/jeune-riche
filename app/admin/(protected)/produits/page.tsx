import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatPrice, cn, LOW_STOCK_THRESHOLD } from "@/lib/utils";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stock?: string }>;
}) {
  // Avant toute lecture en base — voir lib/auth.ts.
  await requireAdmin();
  const { q, stock } = await searchParams;
  let products: Awaited<ReturnType<typeof loadProducts>> = [];
  let available = true;
  try {
    products = await loadProducts(q);
  } catch (err) {
    console.error("[admin/produits]", err);
    available = false;
  }

  const filtered =
    stock === "faible"
      ? products.filter((p) => p.variants.reduce((sum, v) => sum + v.stock, 0) <= LOW_STOCK_THRESHOLD)
      : products;

  function filterHref(nextStock?: string) {
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (nextStock) qs.set("stock", nextStock);
    const s = qs.toString();
    return s ? `/admin/produits?${s}` : "/admin/produits";
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl uppercase text-paper">Produits</h1>
        <Link href="/admin/produits/nouveau" className="bg-paper px-4 py-2 text-xs uppercase tracking-widest2 text-ink">
          + Nouveau produit
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form className="max-w-xs flex-1">
          {stock && <input type="hidden" name="stock" value={stock} />}
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Rechercher un produit…"
            className="w-full border border-line bg-transparent px-4 py-2 text-sm text-paper placeholder:text-paper/30"
          />
        </form>
        <div className="flex gap-2">
          <Link
            href={filterHref(undefined)}
            className={cn(
              "border px-3 py-1.5 text-[10px] uppercase tracking-widest2",
              !stock ? "border-paper bg-paper text-ink" : "border-line text-paper/60 hover:text-paper"
            )}
          >
            Tous
          </Link>
          <Link
            href={filterHref("faible")}
            className={cn(
              "border px-3 py-1.5 text-[10px] uppercase tracking-widest2",
              stock === "faible" ? "border-paper bg-paper text-ink" : "border-line text-paper/60 hover:text-paper"
            )}
          >
            Stock faible
          </Link>
        </div>
      </div>

      {!available && (
        <p className="mt-4 border border-paper/30 bg-paper/5 px-4 py-3 text-xs text-paper">
          Base de données indisponible.
        </p>
      )}

      {available && filtered.length === 0 ? (
        <p className="mt-8 text-sm text-paper/40">Aucun produit trouvé.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((p) => {
            const stockTotal = p.variants.reduce((sum, v) => sum + v.stock, 0);
            const cover = p.images[0];
            return (
              <Link
                key={p.id}
                href={`/admin/produits/${p.id}`}
                className="group block border border-line transition-colors hover:border-paper/40"
              >
                <div className="relative aspect-square bg-line/40">
                  {cover ? (
                    <Image
                      src={cover.url}
                      alt={cover.alt}
                      fill
                      sizes="220px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] uppercase tracking-widest2 text-paper/30">
                      Aucune image
                    </div>
                  )}
                  {p.videoUrl && (
                    <span className="absolute right-1.5 top-1.5 bg-ink/80 px-1.5 py-0.5 text-[9px] uppercase tracking-widest2 text-paper">
                      Vidéo
                    </span>
                  )}
                  {stockTotal <= LOW_STOCK_THRESHOLD && (
                    <span
                      className={cn(
                        "absolute bottom-1.5 right-1.5 px-1.5 py-0.5 text-[9px] uppercase tracking-widest2",
                        stockTotal === 0 ? "bg-paper text-ink" : "bg-ink/80 text-paper"
                      )}
                    >
                      {stockTotal === 0 ? "Rupture" : "Stock faible"}
                    </span>
                  )}
                  <span
                    className={
                      p.published
                        ? "absolute left-1.5 top-1.5 border border-paper/40 bg-ink/80 px-1.5 py-0.5 text-[9px] uppercase tracking-widest2 text-paper"
                        : "absolute left-1.5 top-1.5 border border-line bg-ink/80 px-1.5 py-0.5 text-[9px] uppercase tracking-widest2 text-paper/50"
                    }
                  >
                    {p.published ? "Publié" : "Brouillon"}
                  </span>
                </div>
                <div className="px-1 py-3">
                  <p className="truncate text-sm text-paper group-hover:underline">{p.name}</p>
                  <p className="mt-0.5 text-[11px] text-paper/40">{p.category.name}</p>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-paper/60">
                    <span>{formatPrice(p.price ? Number(p.price) : null)}</span>
                    <span className={stockTotal <= LOW_STOCK_THRESHOLD ? "text-paper" : undefined}>{stockTotal} en stock</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function loadProducts(q?: string) {
  return prisma.product.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
    include: { category: true, variants: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });
}
