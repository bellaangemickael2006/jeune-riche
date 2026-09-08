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
      <h1 className="font-editorial text-4xl text-paper md:text-6xl">Favoris</h1>

      {!loading && products.length === 0 && (
        <EmptyState
          message="Aucun favori pour le moment."
          cta={{ label: "Voir le catalogue", href: "/catalogue" }}
        />
      )}

      {products.length > 0 && (
        <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 md:gap-x-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
