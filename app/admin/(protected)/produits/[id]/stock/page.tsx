import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMovements } from "@/lib/stock/movements";
import StockGrid from "@/components/admin/StockGrid";
import StockHistory from "@/components/admin/StockHistory";

export const dynamic = "force-dynamic";

export default async function ProductStockPage({ params }: { params: Promise<{ id: string }> }) {
  // Avant toute lecture en base — voir lib/auth.ts.
  await requireAdmin("produits");
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, name: true, variants: { select: { id: true, color: true, size: true, stock: true } } },
  });
  if (!product) notFound();
  const movements = await getMovements({ productId: product.id, take: 60 });
  const total = product.variants.reduce((sum, v) => sum + v.stock, 0);

  return (
    <div className="max-w-5xl">
      <Link href={`/admin/produits/${product.id}`} className="text-xs uppercase tracking-widest2 text-paper/60 hover:text-paper">
        ← {product.name}
      </Link>
      <h1 className="mt-3 font-display text-2xl uppercase text-paper">Stock — {product.name}</h1>
      <p className="mt-1 text-xs text-paper/60">
        {product.variants.length} variante{product.variants.length > 1 ? "s" : ""} · {total} pièce{total > 1 ? "s" : ""} en stock
      </p>

      <section className="mt-8 border border-line p-5">
        {product.variants.length === 0 ? (
          <p className="text-sm text-paper/60">
            Aucune variante : ajoutez des tailles et couleurs depuis la{" "}
            <Link href={`/admin/produits/${product.id}`} className="underline underline-offset-4">
              fiche produit
            </Link>
            .
          </p>
        ) : (
          <StockGrid productId={product.id} variants={product.variants} />
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-xs uppercase tracking-widest2 text-paper/70">Historique des mouvements</h2>
        <StockHistory movements={movements} />
      </section>
    </div>
  );
}
