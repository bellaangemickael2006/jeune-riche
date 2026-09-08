"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { useScrollLock } from "@/lib/scrollLock";

// Le tiroir était sur fond `paper` — un panneau blanc qui s'ouvrait sur un site
// noir, avec ses propres filets `ink/10`. Il repasse sur `ink` avec des filets
// `line`, comme le reste du site : le panier est une continuation de la page,
// pas une fenêtre d'un autre système.
//
// Les vignettes passent en `object-contain` sur fond `studio` : en
// `object-cover` dans un cadre portrait, les visuels face+dos en paysage
// étaient recadrés sur une tranche arbitraire du vêtement.
export default function CartDrawer() {
  const { lines, isOpen, close, removeLine, setQuantity, total } = useCart();
  useScrollLock(isOpen);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[90] bg-ink/80"
            onClick={close}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 z-[95] flex h-full w-full max-w-md flex-col border-l border-line bg-ink text-paper"
            role="dialog"
            aria-label="Panier"
          >
            <div className="flex items-baseline justify-between border-b border-line px-6 py-5">
              <p className="text-label text-paper">
                Panier{lines.length > 0 ? ` (${lines.length})` : ""}
              </p>
              <button
                onClick={close}
                aria-label="Fermer le panier"
                className="text-label text-paper/50 transition-colors duration-300 ease-editorial hover:text-paper"
              >
                Fermer
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-start justify-center gap-5 px-6">
                <p className="text-body text-paper/55">Votre panier est vide.</p>
                <Link
                  href="/catalogue"
                  onClick={close}
                  className="border-b border-line pb-1 text-label text-paper/60 transition-colors duration-300 ease-editorial hover:border-paper hover:text-paper"
                >
                  Voir la collection
                </Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 overflow-y-auto px-6">
                  {lines.map((line) => (
                    <li
                      key={`${line.variantId}-${line.personalization ?? ""}`}
                      className="flex gap-4 border-b border-line py-6"
                    >
                      <div className="relative aspect-[5/4] w-28 shrink-0 overflow-hidden bg-studio">
                        <Image
                          src={line.image}
                          alt={line.productName}
                          fill
                          className="object-contain"
                          sizes="112px"
                        />
                      </div>
                      <div className="flex flex-1 flex-col justify-between gap-4">
                        <div>
                          <div className="flex items-baseline justify-between gap-3">
                            <p className="font-editorial text-body text-paper">{line.productName}</p>
                            <p className="shrink-0 text-caption text-paper/70">
                              {formatPrice(line.unitPrice * line.quantity)}
                            </p>
                          </div>
                          <p className="mt-1.5 text-caption text-paper/40">
                            {line.color} · {line.size}
                          </p>
                          {line.personalization && (
                            <p className="mt-1 text-caption text-paper/40">
                              Marquage : <span className="text-paper/80">{line.personalization}</span>
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() =>
                                setQuantity(line.variantId, line.personalization, line.quantity - 1)
                              }
                              className="h-8 w-8 border border-line text-paper/70 transition-colors duration-300 ease-editorial hover:border-paper hover:text-paper"
                              aria-label="Diminuer la quantité"
                            >
                              −
                            </button>
                            <span className="min-w-4 text-center text-caption text-paper">
                              {line.quantity}
                            </span>
                            <button
                              onClick={() =>
                                setQuantity(line.variantId, line.personalization, line.quantity + 1)
                              }
                              className="h-8 w-8 border border-line text-paper/70 transition-colors duration-300 ease-editorial hover:border-paper hover:text-paper"
                              aria-label="Augmenter la quantité"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeLine(line.variantId, line.personalization)}
                            className="text-label text-paper/35 transition-colors duration-300 ease-editorial hover:text-paper"
                          >
                            Retirer
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-line px-6 py-6">
                  <div className="mb-5 flex items-baseline justify-between">
                    <span className="text-label text-paper/45">Sous-total</span>
                    <span className="text-body text-paper">{formatPrice(total())}</span>
                  </div>
                  <Link
                    href="/checkout"
                    onClick={close}
                    className="block w-full bg-paper py-4 text-center text-label text-ink transition-colors duration-300 ease-editorial hover:bg-studio"
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
