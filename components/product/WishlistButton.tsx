"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useWishlist } from "@/store/wishlist";
import { cn } from "@/lib/utils";

export default function WishlistButton({ slug, className }: { slug: string; className?: string }) {
  const { t } = useTranslation();
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
      aria-label={mounted && has ? t("product.removeFromFavorites") : t("product.addToFavorites")}
      className={cn(
        "flex items-center gap-2 text-label transition-colors",
        mounted && has ? "text-paper" : "text-paper/50 hover:text-paper",
        className
      )}
    >
      <span className="relative inline-grid h-4 w-4 place-items-center" aria-hidden>
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={mounted && has ? "filled" : "empty"}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 grid place-items-center"
          >
            {mounted && has ? "♥" : "♡"}
          </motion.span>
        </AnimatePresence>
      </span>
      {mounted && has ? t("product.inFavorites") : t("product.addToFavorites")}
    </button>
  );
}
