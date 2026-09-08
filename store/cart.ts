"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine } from "@/types";

type CartState = {
  lines: CartLine[];
  isOpen: boolean;
  /** Vrai dès que l'utilisateur a modifié le panier lui-même. Voir `merge`. */
  touched: boolean;
  open: () => void;
  close: () => void;
  addLine: (line: CartLine) => void;
  removeLine: (variantId: string, personalization: string | null) => void;
  setQuantity: (variantId: string, personalization: string | null, quantity: number) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
};

function sameLine(a: CartLine, variantId: string, personalization: string | null) {
  return a.variantId === variantId && (a.personalization ?? null) === (personalization ?? null);
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      isOpen: false,
      touched: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      addLine: (line) =>
        set((state) => {
          const existing = state.lines.find((l) =>
            sameLine(l, line.variantId, line.personalization)
          );
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                sameLine(l, line.variantId, line.personalization)
                  ? { ...l, quantity: l.quantity + line.quantity }
                  : l
              ),
              isOpen: true,
              touched: true,
            };
          }
          return { lines: [...state.lines, line], isOpen: true, touched: true };
        }),
      removeLine: (variantId, personalization) =>
        set((state) => ({
          lines: state.lines.filter((l) => !sameLine(l, variantId, personalization)),
          touched: true,
        })),
      setQuantity: (variantId, personalization, quantity) =>
        set((state) => ({
          lines: state.lines
            .map((l) =>
              sameLine(l, variantId, personalization) ? { ...l, quantity } : l
            )
            .filter((l) => l.quantity > 0),
          touched: true,
        })),
      clear: () => set({ lines: [], touched: true }),
      total: () => get().lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
      count: () => get().lines.reduce((sum, l) => sum + l.quantity, 0),
    }),
    {
      name: "jeune-riche-cart",
      // La réhydratation automatique se ferait de façon synchrone dès le
      // premier rendu client, avant que React n'ait eu le temps de
      // comparer au HTML serveur (qui, lui, ne connaît jamais le panier
      // persisté) — d'où une erreur d'hydratation systématique. On la
      // déclenche manuellement après le montage via StoreHydration.
      skipHydration: true,
      // `touched` ne doit jamais être écrit sur le disque : c'est un état de
      // session, pas une donnée de panier.
      partialize: (state) => ({ lines: state.lines }),
      // Entre l'instant où React rend le bouton « Ajouter » interactif et
      // l'instant où StoreHydration relit localStorage, il existe une fenêtre
      // de quelques millisecondes. Un ajout fait dans cette fenêtre était
      // silencieusement écrasé par la réhydratation (constaté par les tests :
      // un favori posé immédiatement après le chargement disparaissait). Si
      // l'utilisateur a déjà agi, sa décision prime sur le contenu du disque.
      merge: (persisted, current) => {
        if (current.touched) return current;
        return { ...current, ...(persisted as Partial<CartState>) };
      },
    }
  )
);
