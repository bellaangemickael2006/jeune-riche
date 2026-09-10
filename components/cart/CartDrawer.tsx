"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { useScrollLock } from "@/lib/scrollLock";
import { useLocale } from "@/components/providers/I18nProvider";
import { ButtonLink } from "@/components/ui/Button";

export default function CartDrawer() {
  const { t } = useTranslation();
  const { locale } = useLocale();
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
            aria-label={t("cart.title")}
          >
            {/* Le compte est écrit en chiffres, à côté du mot — "PANIER 02"
                plutôt qu'une pastille numérotée sur une icône. */}
            <div className="flex items-baseline justify-between border-b border-ink/15 px-6 py-5">
              <p className="font-display text-lg uppercase tracking-widest2">
                {t("cart.title")}
                {lines.length > 0 && (
                  <span className="ml-3 tabular-nums text-ink/40">
                    {String(lines.length).padStart(2, "0")}
                  </span>
                )}
              </p>
              <button
                onClick={close}
                aria-label={t("common.close")}
                className="text-label border-b border-ink/30 pb-0.5 transition-colors hover:border-ink"
              >
                {t("common.close")}
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-start justify-end gap-4 px-6 pb-8">
                <p className="font-editorial text-2xl text-ink/70">{t("cart.empty")}</p>
                <Link
                  href="/catalogue"
                  onClick={close}
                  className="text-label border-b border-ink/30 pb-1 transition-colors hover:border-ink"
                >
                  {t("common.viewCatalogue")}
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
                      {/* object-contain sur fond studio : les visuels sont des
                          mockups produit, un object-cover les rognait en plein
                          milieu du vêtement. */}
                      <div className="relative h-24 w-20 shrink-0 overflow-hidden bg-studio">
                        <Image src={line.image} alt={line.productName} fill className="object-contain p-1" sizes="80px" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-editorial text-base leading-tight">{line.productName}</p>
                            <p className="text-label mt-1.5 text-ink/45">
                              {line.color} · {line.size}
                            </p>
                            {line.personalization && (
                              <p className="mt-1 text-xs text-ink/50">
                                {t("cart.personalization")} : <span className="text-ink">{line.personalization}</span>
                              </p>
                            )}
                          </div>
                          <p className="shrink-0 text-sm">{formatPrice(line.unitPrice * line.quantity, locale)}</p>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          {/* Compteur d'un seul tenant, filets partagés — pas
                              trois petites boîtes séparées. */}
                          <div className="flex items-stretch border border-ink/20 text-sm">
                            <button
                              onClick={() =>
                                setQuantity(line.variantId, line.personalization, line.quantity - 1)
                              }
                              className="w-8 py-1 transition-colors hover:bg-ink/5"
                              aria-label={t("cart.decreaseQuantity")}
                            >
                              −
                            </button>
                            <span className="flex w-8 items-center justify-center border-x border-ink/20 tabular-nums">
                              {line.quantity}
                            </span>
                            <button
                              onClick={() =>
                                setQuantity(line.variantId, line.personalization, line.quantity + 1)
                              }
                              className="w-8 py-1 transition-colors hover:bg-ink/5"
                              aria-label={t("cart.increaseQuantity")}
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeLine(line.variantId, line.personalization)}
                            className="text-label text-ink/40 transition-colors hover:text-ink"
                          >
                            {t("cart.remove")}
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-ink/15 px-6 py-6">
                  <div className="mb-5 flex items-baseline justify-between border-b border-ink/15 pb-4">
                    <span className="text-label text-ink/45">{t("cart.subtotal")}</span>
                    <span className="font-editorial text-xl tabular-nums">
                      {formatPrice(total(), locale)}
                    </span>
                  </div>
                  <ButtonLink href="/checkout" onClick={close} variant="dark" className="w-full">
                    {t("cart.checkout")}
                  </ButtonLink>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
