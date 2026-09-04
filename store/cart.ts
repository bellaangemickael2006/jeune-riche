"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine } from "@/types";

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
                  ? { ...l, quantity: l.quantity + line.quantity }
                  : l
              ),
              isOpen: true,
            };
          }
          return { lines: [...state.lines, line], isOpen: true };
        }),
      removeLine: (variantId, personalization) =>
        set((state) => ({
          lines: state.lines.filter((l) => !sameLine(l, variantId, personalization)),
        })),
      setQuantity: (variantId, personalization, quantity) =>
        set((state) => ({
          lines: state.lines
            .map((l) =>
              sameLine(l, variantId, personalization) ? { ...l, quantity } : l
            )
            .filter((l) => l.quantity > 0),
        })),
      clear: () => set({ lines: [] }),
      total: () => get().lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
      count: () => get().lines.reduce((sum, l) => sum + l.quantity, 0),
    }),
    { name: "jeune-riche-cart" }
  )
);
