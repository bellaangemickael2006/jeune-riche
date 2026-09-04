"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/lib/utils";

export default function CartDrawer() {
  const { lines, isOpen, close, removeLine, setQuantity, total } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[90] bg-ink/70"
            onClick={close}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 z-[95] flex h-full w-full max-w-md flex-col bg-paper text-ink"
            role="dialog"
            aria-label="Panier"
          >
            <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
              <p className="font-display text-lg uppercase tracking-wide">
                Panier {lines.length > 0 && `(${lines.length})`}
              </p>
              <button onClick={close} aria-label="Fermer le panier" className="text-sm uppercase tracking-widest2">
                Fermer
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <p className="text-sm text-ink/60">Votre panier est vide.</p>
                <Link
                  href="/catalogue"
                  onClick={close}
                  className="text-xs uppercase tracking-widest2 underline underline-offset-4"
                >
                  Voir le catalogue
                </Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 overflow-y-auto px-6 py-4">
                  {lines.map((line) => (
                    <li
                      key={`${line.variantId}-${line.personalization ?? ""}`}
                      className="flex gap-4 border-b border-ink/10 py-5"
                    >
                      <div className="relative h-24 w-20 shrink-0 overflow-hidden bg-ink/5">
                        <Image src={line.image} alt={line.productName} fill className="object-cover" sizes="80px" />
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <p className="text-sm font-medium">{line.productName}</p>
                          <p className="mt-1 text-xs text-ink/50">
                            {line.color} · {line.size}
                          </p>
                          {line.personalization && (
                            <p className="mt-1 text-xs text-ink/50">
                              Personnalisation : <span className="text-ink">{line.personalization}</span>
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs">
                            <button
                              onClick={() =>
                                setQuantity(line.variantId, line.personalization, line.quantity - 1)
                              }
                              className="h-6 w-6 border border-ink/20"
                              aria-label="Diminuer la quantité"
                            >
                              −
                            </button>
                            <span>{line.quantity}</span>
                            <button
                              onClick={() =>
                                setQuantity(line.variantId, line.personalization, line.quantity + 1)
                              }
                              className="h-6 w-6 border border-ink/20"
                              aria-label="Augmenter la quantité"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeLine(line.variantId, line.personalization)}
                            className="text-xs uppercase tracking-widest2 text-ink/40 hover:text-ink"
                          >
                            Retirer
                          </button>
                        </div>
                      </div>
                      <p className="shrink-0 text-sm">{formatPrice(line.unitPrice * line.quantity)}</p>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-ink/10 px-6 py-6">
                  <div className="mb-4 flex items-center justify-between text-sm">
                    <span className="uppercase tracking-widest2 text-ink/50">Sous-total</span>
                    <span className="font-medium">{formatPrice(total())}</span>
                  </div>
                  <Link
                    href="/checkout"
                    onClick={close}
                    className="block w-full bg-ink py-4 text-center text-xs uppercase tracking-widest2 text-paper transition-opacity hover:opacity-90"
                  >
                    Commander
                  </Link>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
