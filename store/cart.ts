"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine } from "@/types";
import { MAX_CART_LINES, MAX_LINE_QUANTITY } from "@/lib/orders/limits";

type CartState = {
  lines: CartLine[];
  isOpen: boolean;
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
                  ? { ...l, quantity: Math.min(l.quantity + line.quantity, MAX_LINE_QUANTITY) }
                  : l
              ),
              isOpen: true,
            };
          }
          // Au-delà, le serveur refuserait la commande : on garde le panier tel quel.
          if (state.lines.length >= MAX_CART_LINES) return { isOpen: true };
          return { lines: [...state.lines, { ...line, quantity: Math.min(line.quantity, MAX_LINE_QUANTITY) }], isOpen: true };
        }),
      removeLine: (variantId, personalization) =>
        set((state) => ({
          lines: state.lines.filter((l) => !sameLine(l, variantId, personalization)),
        })),
      setQuantity: (variantId, personalization, quantity) =>
        set((state) => ({
          lines: state.lines
            .map((l) =>
              sameLine(l, variantId, personalization) ? { ...l, quantity: Math.min(quantity, MAX_LINE_QUANTITY) } : l
            )
            .filter((l) => l.quantity > 0),
        })),
      clear: () => set({ lines: [] }),
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
    }
  )
);
