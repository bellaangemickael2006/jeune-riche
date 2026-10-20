"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { useScrollLock } from "@/lib/scrollLock";
import { useLocale } from "@/components/providers/I18nProvider";

export default function CartDrawer() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { lines, isOpen, close, removeLine, setQuantity, total } = useCart();
  useScrollLock(isOpen);

  // Échap ferme le panier, comme le menu et la recherche du header.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-90 bg-ink/70"
            onClick={close}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 z-95 flex h-full w-full max-w-md flex-col bg-paper text-ink"
            role="dialog"
            aria-label={t("cart.title")}
          >
            <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
              <p className="font-display text-lg uppercase tracking-wide">
                {lines.length > 0 ? t("cart.titleWithCount", { count: lines.length }) : t("cart.title")}
              </p>
              <button onClick={close} aria-label={t("common.close")} className="text-sm uppercase tracking-widest2">
                {t("common.close")}
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <p className="text-sm text-ink/60">{t("cart.empty")}</p>
                <Link
                  href="/catalogue"
                  onClick={close}
                  className="text-xs uppercase tracking-widest2 underline underline-offset-4"
                >
                  {t("common.viewCatalogue")}
                </Link>
              </div>
            ) : (
              <>
                <ul data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain px-6 py-4">
                  {lines.map((line) => (
                    <li
                      key={`${line.variantId}-${line.personalization ?? ""}`}
                      className="flex gap-4 border-b border-ink/10 py-5"
                    >
                      <div className="relative h-24 w-20 shrink-0 overflow-hidden bg-ink/5">
                        <Image src={line.image} alt={line.productName} fill className="object-cover" sizes="80px" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{line.productName}</p>
                            <p className="mt-1 text-xs text-ink/50">
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
                          <div className="flex items-center gap-2 text-xs">
                            <button
                              onClick={() =>
                                setQuantity(line.variantId, line.personalization, line.quantity - 1)
                              }
                              className="h-6 w-6 border border-ink/20"
                              aria-label={t("cart.decreaseQuantity")}
                            >
                              −
                            </button>
                            <span>{line.quantity}</span>
                            <button
                              onClick={() =>
                                setQuantity(line.variantId, line.personalization, line.quantity + 1)
                              }
                              className="h-6 w-6 border border-ink/20"
                              aria-label={t("cart.increaseQuantity")}
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeLine(line.variantId, line.personalization)}
                            className="text-xs uppercase tracking-widest2 text-ink/40 hover:text-ink"
                          >
                            {t("cart.remove")}
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-ink/10 px-6 py-6">
                  <div className="mb-4 flex items-center justify-between text-sm">
                    <span className="uppercase tracking-widest2 text-ink/50">{t("cart.subtotal")}</span>
                    <span className="font-medium">{formatPrice(total(), locale)}</span>
                  </div>
                  <Link
                    href="/checkout"
                    onClick={close}
                    className="block w-full bg-ink py-4 text-center text-xs uppercase tracking-widest2 text-paper transition-opacity hover:opacity-90"
                  >
                    {t("cart.checkout")}
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
