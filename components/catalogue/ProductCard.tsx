"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatPrice, cn } from "@/lib/utils";
import type { ProductCardData } from "@/types";

export default function ProductCard({ product, index }: { product: ProductCardData; index: number }) {
  const [hovered, setHovered] = useState(false);
  const primary = product.images[0];
  const secondary = product.images[1] ?? primary;
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

  return (
    <Link
      href={`/catalogue/${product.slug}`}
      className="group block"
      style={{ animationDelay: `${index * 60}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-line">
        {primary && (
          <Image
            src={primary.url}
            alt={primary.alt}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className={cn(
              "object-cover transition-all duration-500 ease-editorial group-hover:scale-[1.03]",
              hovered && secondary ? "opacity-0" : "opacity-100"
            )}
          />
        )}
        {secondary && (
          <Image
            src={secondary.url}
            alt={secondary.alt}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className={cn(
              "object-cover transition-opacity duration-500 ease-editorial",
              hovered ? "opacity-100" : "opacity-0"
            )}
          />
        )}
        {totalStock === 0 && (
          <span className="absolute left-3 top-3 bg-ink px-2 py-1 text-[10px] uppercase tracking-widest2 text-paper">
            Épuisé
          </span>
        )}
      </div>
      <div className="mt-3 flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest2 text-paper/40">{product.category.name}</p>
          <p className="mt-1 text-sm text-paper">{product.name}</p>
        </div>
        <p className="text-sm text-paper/70">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}
