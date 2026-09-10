"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatPrice, getDropCountdown } from "@/lib/utils";
import type { ProductCardData } from "@/types";
import FadeIn from "@/components/ui/FadeIn";
import CountdownTimer from "@/components/ui/CountdownTimer";
import { useLocale } from "@/components/providers/I18nProvider";

// La carte portait un tilt 3D au mouvement de souris, un halo radial qui
// suivait le curseur et deux ressorts framer-motion — trois effets empilés
// qui attiraient l'œil plus que le vêtement. Il ne reste qu'un fondu entre
// la photo de face et la seconde photo au survol : le geste utile, celui qui
// montre la pièce sous un autre angle.
//
// Ce n'est plus une carte non plus : pas de cadre, pas de fond, pas d'ombre.
// L'image sur son fond studio, puis le nom et le prix sous un filet.
export default function ProductCard({ product, index }: { product: ProductCardData; index: number }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [hovered, setHovered] = useState(false);

  const primary = product.images[0];
  const secondary = product.images[1] ?? null;
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const countdown = getDropCountdown(product.drop);

  return (
    <FadeIn delay={(index % 4) * 0.05} y={16}>
      <Link
        href={`/catalogue/${product.slug}`}
        className="group block"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-studio">
          {primary && (
            <Image
              src={primary.url}
              alt={primary.alt}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              priority={index < 4}
              className="object-contain p-4 transition-opacity duration-500 ease-editorial"
              style={{ opacity: hovered && secondary ? 0 : 1 }}
            />
          )}
          {secondary && (
            <Image
              src={secondary.url}
              alt={secondary.alt}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-contain p-4 transition-opacity duration-500 ease-editorial"
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

        <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-line pt-3">
          <div className="min-w-0">
            <p className="truncate font-editorial text-base text-paper transition-opacity group-hover:opacity-70">
              {product.name}
            </p>
            <p className="text-label mt-1 truncate text-paper/35">{product.category.name}</p>
          </div>
          <p className="text-caption shrink-0 tabular-nums text-paper/50">
            {formatPrice(product.price, locale, t("product.priceUndefined"))}
          </p>
        </div>
      </Link>
    </FadeIn>
  );
}
