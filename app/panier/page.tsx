"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import EmptyState from "@/components/ui/EmptyState";
import { useLocale } from "@/components/providers/I18nProvider";

export default function PanierPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { lines, removeLine, setQuantity, total } = useCart();

  return (
    <div className="min-h-screen bg-ink px-5 pb-24 pt-32 md:px-10 md:pt-40">
      <h1 className="font-editorial text-4xl text-paper md:text-6xl">{t("cart.title")}</h1>

      {lines.length === 0 ? (
        <EmptyState message={t("cart.empty")} cta={{ label: t("common.viewCatalogue"), href: "/catalogue" }} />
      ) : (
        <div className="mt-12 grid gap-12 md:grid-cols-[1fr_360px]">
          <ul className="divide-y divide-line">
            {lines.map((line) => (
              <li key={`${line.variantId}-${line.personalization ?? ""}`} className="flex gap-4 py-6 sm:gap-5">
                <div className="relative h-28 w-20 shrink-0 overflow-hidden bg-line sm:h-32 sm:w-24">
                  <Image src={line.image} alt={line.productName} fill className="object-cover" sizes="96px" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-paper">{line.productName}</p>
                      <p className="mt-1 text-xs text-paper/50">{line.color} · {line.size}</p>
                      {line.personalization && (
                        <p className="mt-1 text-xs text-paper/50">
                          {t("cart.personalization")} : <span className="text-paper">{line.personalization}</span>
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 text-sm text-paper">{formatPrice(line.unitPrice * line.quantity, locale)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <button
                      onClick={() => setQuantity(line.variantId, line.personalization, line.quantity - 1)}
                      className="h-7 w-7 border border-line text-paper"
                      aria-label={t("cart.decreaseQuantity")}
                    >
                      −
                    </button>
                    <span className="text-paper">{line.quantity}</span>
                    <button
                      onClick={() => setQuantity(line.variantId, line.personalization, line.quantity + 1)}
                      className="h-7 w-7 border border-line text-paper"
                      aria-label={t("cart.increaseQuantity")}
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeLine(line.variantId, line.personalization)}
                      className="text-paper/40 underline underline-offset-4 hover:text-paper sm:ml-4"
                    >
                      {t("cart.remove")}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="h-fit border border-line p-6">
            <div className="flex items-center justify-between text-sm">
              <span className="uppercase tracking-widest2 text-paper/50">{t("cart.subtotal")}</span>
              <span className="text-paper">{formatPrice(total(), locale)}</span>
            </div>
            <p className="mt-2 text-xs text-paper/40">{t("cart.shippingNotice")}</p>
            <Link
              href="/checkout"
              className="mt-6 block w-full bg-paper py-4 text-center text-xs uppercase tracking-widest2 text-ink transition-opacity hover:opacity-90"
            >
              {t("cart.checkoutFull")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
