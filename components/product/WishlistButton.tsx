"use client";

import { useEffect, useState } from "react";
import { useWishlist } from "@/store/wishlist";
import { cn } from "@/lib/utils";

// Action secondaire : elle ne doit jamais concurrencer « Ajouter ». Le cœur
// (♥/♡) et son animation de rebond au clic sont retirés — un pictogramme
// décoratif animé pour un état booléen, dans une interface qui n'en utilise
// nulle part ailleurs. L'état se lit au texte et au filet.
export default function WishlistButton({ slug, className }: { slug: string; className?: string }) {
  const toggle = useWishlist((s) => s.toggle);
  const has = useWishlist((s) => s.has(slug));
  const [mounted, setMounted] = useState(false);

  // évite un mismatch d'hydratation : le store persisté ne se lit qu'au montage client
  useEffect(() => setMounted(true), []);

  const active = mounted && has;

  return (
    <button
      type="button"
      onClick={() => toggle(slug)}
      aria-pressed={active}
      className={cn(
        "border-b pb-1 text-label transition-colors duration-300 ease-editorial",
        active
          ? "border-paper text-paper"
          : "border-transparent text-paper/45 hover:border-paper/40 hover:text-paper",
        className
      )}
    >
      {active ? "Dans vos favoris" : "Ajouter aux favoris"}
    </button>
  );
}
