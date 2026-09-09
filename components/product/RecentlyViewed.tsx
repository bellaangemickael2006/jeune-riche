"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { getRecentlyViewed, type RecentlyViewedItem } from "@/lib/recentlyViewed";
import { formatPrice } from "@/lib/utils";
import { useLocale } from "@/components/providers/I18nProvider";

// Purement client (localStorage) : rendu vide au premier passage serveur,
// rempli après montage — pas de risque de désynchronisation d'hydratation
// puisque le serveur ne rend jamais rien ici.
export default function RecentlyViewed({ excludeSlug }: { excludeSlug?: string }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    setItems(getRecentlyViewed().filter((i) => i.slug !== excludeSlug));
  }, [excludeSlug]);

  if (items.length === 0) return null;

  return (
    <section className="mx-auto mt-16 max-w-6xl border-t border-line pt-16">
      <h2 className="font-editorial text-heading text-paper">{t("product.recentlyViewed")}</h2>
      <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4">
        {items.map((item) => (
          <Link key={item.slug} href={`/catalogue/${item.slug}`} className="group block">
            <div className="relative aspect-[4/5] overflow-hidden bg-studio">
              {item.image && (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-contain p-4 transition-transform duration-500 ease-editorial group-hover:scale-105"
                />
              )}
            </div>
            <p className="mt-3 font-editorial text-body text-paper">{item.name}</p>
            <p className="text-caption text-paper/60">{formatPrice(item.price, locale, t("product.priceUndefined"))}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
