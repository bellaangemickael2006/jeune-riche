"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatPrice, getDropCountdown, cn } from "@/lib/utils";
import type { ProductCardData } from "@/types";
import FadeIn from "@/components/ui/FadeIn";
import CountdownTimer from "@/components/ui/CountdownTimer";
import { useLocale } from "@/components/providers/I18nProvider";

// Six pièces dans une grille de quatre colonnes donnent une grille aux trois
// quarts vide : le catalogue avait l'air inachevé alors qu'il est simplement
// resserré. En liste, une pièce par ligne et une grande image, les mêmes six
// pièces se lisent comme une collection assumée.
//
// L'alternance gauche/droite évite que la page devienne une colonne de blocs
// identiques — c'est la composition qui donne le rythme, pas une animation.
export default function ProductRow({
  product,
  index,
}: {
  product: ProductCardData;
  index: number;
}) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [hovered, setHovered] = useState(false);

  const primary = product.images[0];
  const secondary = product.images[1] ?? null;
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const countdown = getDropCountdown(product.drop);
  const sizes = Array.from(new Set(product.variants.map((v) => v.size)));
  const reversed = index % 2 === 1;

  return (
    <FadeIn y={18} delay={0.04}>
      <Link
        href={`/catalogue/${product.slug}`}
        className="group grid grid-cols-1 items-center gap-6 border-t border-line py-8 md:grid-cols-2 md:gap-16 md:py-12"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className={cn("relative aspect-[4/3] overflow-hidden bg-studio md:aspect-[5/4]", reversed && "md:order-2")}>
          {primary && (
            <Image
              src={primary.url}
              alt={primary.alt}
              fill
              sizes="(max-width: 768px) 100vw, 48vw"
              priority={index < 2}
              className="object-contain p-6 transition-opacity duration-500 ease-editorial md:p-10"
              style={{ opacity: hovered && secondary ? 0 : 1 }}
            />
          )}
          {secondary && (
            <Image
              src={secondary.url}
              alt={secondary.alt}
              fill
              sizes="(max-width: 768px) 100vw, 48vw"
              className="object-contain p-6 transition-opacity duration-500 ease-editorial md:p-10"
              style={{ opacity: hovered ? 1 : 0 }}
            />
          )}

          {totalStock === 0 && (
            <span className="text-label absolute left-0 top-0 bg-ink px-3 py-2 text-paper">
              {t("product.soldOut")}
            </span>
          )}
          {countdown && (
            <div className="absolute right-3 top-3">
              <CountdownTimer target={countdown.target} variant="badge" />
            </div>
          )}
        </div>

        <div className={cn("min-w-0", reversed && "md:order-1")}>
          <p className="text-label text-paper/35">{product.category.name}</p>
          <h2 className="mt-3 font-editorial text-heading leading-none text-paper transition-opacity group-hover:opacity-70 md:text-[2.5rem]">
            {product.name}
          </h2>
          <p className="mt-4 font-editorial text-xl tabular-nums text-paper/70">
            {formatPrice(product.price, locale, t("product.priceUndefined"))}
          </p>

          {sizes.length > 0 && (
            <p className="text-label mt-5 text-paper/30">{sizes.join(" · ")}</p>
          )}

          {product.personalizationEnabled && (
            <p className="text-label mt-2 text-paper/45">{t("catalogue.personalizable")}</p>
          )}

          <span className="text-label mt-7 inline-block border-b border-paper/25 pb-1 text-paper/60 transition-colors group-hover:border-paper group-hover:text-paper">
            {t("catalogue.viewPiece")}
          </span>
        </div>
      </Link>
    </FadeIn>
  );
}
