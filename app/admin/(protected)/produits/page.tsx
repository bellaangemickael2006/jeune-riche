import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export default async function AdminProductsPage() {
  let products: Awaited<ReturnType<typeof loadProducts>> = [];
  let available = true;
  try {
    products = await loadProducts();
  } catch {
    available = false;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl uppercase text-paper">Produits</h1>
        <Link href="/admin/produits/nouveau" className="bg-paper px-4 py-2 text-xs uppercase tracking-widest2 text-ink">
          + Nouveau produit
        </Link>
      </div>

      {!available && (
        <p className="mt-4 border border-blood/40 bg-blood/10 px-4 py-3 text-xs text-blood">
          Base de données indisponible.
        </p>
      )}

      {available && products.length === 0 ? (
        <p className="mt-8 text-sm text-paper/40">Aucun produit. Créez-en un pour commencer.</p>
      ) : (
        <table className="mt-8 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-widest2 text-paper/40">
              <th className="py-2">Nom</th>
              <th className="py-2">Catégorie</th>
              <th className="py-2">Prix</th>
              <th className="py-2">Stock total</th>
              <th className="py-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const stock = p.variants.reduce((sum, v) => sum + v.stock, 0);
              return (
                <tr key={p.id} className="border-b border-line/50">
                  <td className="py-3">
                    <Link href={`/admin/produits/${p.id}`} className="text-paper hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="py-3 text-paper/60">{p.category.name}</td>
                  <td className="py-3 text-paper/60">{formatPrice(p.price ? Number(p.price) : null)}</td>
                  <td className="py-3 text-paper/60">{stock}</td>
                  <td className="py-3">
                    <span
                      className={
                        p.published
                          ? "border border-paper/30 px-2 py-1 text-[10px] uppercase tracking-widest2 text-paper"
                          : "border border-line px-2 py-1 text-[10px] uppercase tracking-widest2 text-paper/40"
                      }
                    >
                      {p.published ? "Publié" : "Brouillon"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function loadProducts() {
  return prisma.product.findMany({
    include: { category: true, variants: true },
    orderBy: { createdAt: "desc" },
  });
}
