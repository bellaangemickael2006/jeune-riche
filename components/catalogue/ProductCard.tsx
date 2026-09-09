"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useTranslation } from "react-i18next";
import { formatPrice, getDropCountdown } from "@/lib/utils";
import type { ProductCardData } from "@/types";
import FadeIn from "@/components/ui/FadeIn";
import CountdownTimer from "@/components/ui/CountdownTimer";
import { useLocale } from "@/components/providers/I18nProvider";

export default function ProductCard({ product, index }: { product: ProductCardData; index: number }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [6, -6]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-6, 6]), { stiffness: 200, damping: 20 });
  const glowX = useTransform(mouseX, (v) => `${v * 100}%`);
  const glowY = useTransform(mouseY, (v) => `${v * 100}%`);

  function handleMouseMove(e: React.MouseEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  }

  function handleLeave() {
    setHovered(false);
    mouseX.set(0.5);
    mouseY.set(0.5);
  }

  const primary = product.images[0];
  const secondary = product.images[1] ?? primary;
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const countdown = getDropCountdown(product.drop);

  return (
    <FadeIn delay={index * 0.05} y={16}>
      <Link href={`/catalogue/${product.slug}`} className="group block">
        <motion.div
          ref={ref}
          onMouseEnter={() => setHovered(true)}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleLeave}
          style={{ rotateX, rotateY, transformPerspective: 800 }}
          className="relative aspect-[4/5] overflow-hidden bg-studio"
        >
          {primary && (
            <motion.div
              animate={{ opacity: hovered && secondary ? 0 : 1, scale: hovered ? 1.03 : 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
            >
              <Image
                src={primary.url}
                alt={primary.alt}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-contain p-4"
              />
            </motion.div>
          )}
          {secondary && (
            <motion.div
              animate={{ opacity: hovered ? 1 : 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
            >
              <Image
                src={secondary.url}
                alt={secondary.alt}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-contain p-4"
              />
            </motion.div>
          )}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background: useTransform(
                [glowX, glowY],
                ([gx, gy]) => `radial-gradient(280px circle at ${gx} ${gy}, rgba(11,11,12,0.16), transparent 70%)`
              ),
            }}
          />
          {totalStock === 0 && (
            <span className="absolute left-3 top-3 bg-ink px-2 py-1 text-[10px] uppercase tracking-widest2 text-paper">
              {t("product.soldOut")}
            </span>
          )}
          {countdown && (
            <div className="absolute right-3 top-3">
              <CountdownTimer target={countdown.target} variant="badge" />
            </div>
          )}
        </motion.div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-widest2 text-paper/40">{product.category.name}</p>
            <p className="mt-1 font-editorial text-base text-paper">{product.name}</p>
          </div>
          <p className="shrink-0 text-sm text-paper/70">{formatPrice(product.price, locale, t("product.priceUndefined"))}</p>
        </div>
      </Link>
    </FadeIn>
  );
}
