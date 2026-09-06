"use client";

import { useEffect, useState } from "react";
import { useWishlist } from "@/store/wishlist";
import { cn } from "@/lib/utils";

export default function WishlistButton({ slug, className }: { slug: string; className?: string }) {
  const toggle = useWishlist((s) => s.toggle);
  const has = useWishlist((s) => s.has(slug));
  const [mounted, setMounted] = useState(false);

  // évite un mismatch d'hydratation : le store persisté ne se lit qu'au montage client
  useEffect(() => setMounted(true), []);

  return (
    <button
      type="button"
      onClick={() => toggle(slug)}
      aria-pressed={mounted && has}
      aria-label={mounted && has ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={cn(
        "flex items-center gap-2 text-xs uppercase tracking-widest2 transition-colors",
        mounted && has ? "text-paper" : "text-paper/50 hover:text-paper",
        className
      )}
    >
      <span aria-hidden>{mounted && has ? "♥" : "♡"}</span>
      {mounted && has ? "Dans vos favoris" : "Ajouter aux favoris"}
    </button>
  );
}
