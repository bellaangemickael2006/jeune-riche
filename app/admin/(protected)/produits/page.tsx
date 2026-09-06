import Link from "next/link";
import Image from "next/image";
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
        <p className="mt-4 border border-paper/30 bg-paper/5 px-4 py-3 text-xs text-paper">
          Base de données indisponible.
        </p>
      )}

      {available && products.length === 0 ? (
        <p className="mt-8 text-sm text-paper/40">Aucun produit. Créez-en un pour commencer.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((p) => {
            const stock = p.variants.reduce((sum, v) => sum + v.stock, 0);
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
                    <span>{stock} en stock</span>
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

function loadProducts() {
  return prisma.product.findMany({
    include: { category: true, variants: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });
}
