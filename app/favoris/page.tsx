"use client";

import { useEffect, useState } from "react";
import { useWishlist } from "@/store/wishlist";
import ProductCard from "@/components/catalogue/ProductCard";
import EmptyState from "@/components/ui/EmptyState";
import type { ProductCardData } from "@/types";

export default function FavorisPage() {
  const slugs = useWishlist((s) => s.slugs);
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slugs.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch("/api/products/by-slugs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slugs }),
    })
      .then((res) => res.json())
      .then((data) => setProducts(data.products ?? []))
      .finally(() => setLoading(false));
  }, [slugs]);

  return (
    <div className="min-h-screen bg-ink px-5 pb-24 pt-32 md:px-10 md:pt-40">
      <div className="border-b border-line pb-4">
        <p className="text-label text-paper/40">Favoris</p>
      </div>
      <h1 className="mt-16 font-editorial text-heading-lg leading-[1.05] text-paper md:mt-20 md:text-[4rem]">
        Vos pièces retenues
      </h1>

      {!loading && products.length === 0 && (
        <EmptyState
          message="Aucun favori pour le moment."
          cta={{ label: "Voir la collection", href: "/catalogue" }}
        />
      )}

      {/* Même grille que le catalogue : une colonne sous 640px, les visuels
          produit étant des paires face+dos en paysage. */}
      {products.length > 0 && (
        <div className="mt-14 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 md:grid-cols-3 md:gap-x-8 md:gap-y-20 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
