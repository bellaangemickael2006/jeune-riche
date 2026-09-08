"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type WishlistState = {
  slugs: string[];
  /** Vrai dès que l'utilisateur a modifié ses favoris lui-même. Voir `merge`. */
  touched: boolean;
  toggle: (slug: string) => void;
  has: (slug: string) => boolean;
};

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      slugs: [],
      touched: false,
      toggle: (slug) =>
        set((state) => ({
          slugs: state.slugs.includes(slug)
            ? state.slugs.filter((s) => s !== slug)
            : [...state.slugs, slug],
          touched: true,
        })),
      has: (slug) => get().slugs.includes(slug),
    }),
    {
      name: "jeune-riche-wishlist",
      // Voir le commentaire équivalent dans store/cart.ts.
      skipHydration: true,
      partialize: (state) => ({ slugs: state.slugs }),
      // Même course que pour le panier : un favori posé dans les quelques
      // millisecondes entre l'hydratation de React et la relecture de
      // localStorage était écrasé par la réhydratation. La décision de
      // l'utilisateur prime sur le contenu du disque.
      merge: (persisted, current) => {
        if (current.touched) return current;
        return { ...current, ...(persisted as Partial<WishlistState>) };
      },
    }
  )
);
