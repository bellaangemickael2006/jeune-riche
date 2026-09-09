"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import ImageZoomModal from "@/components/product/ImageZoomModal";
import {
  PERSONALIZATION_OVERLAY_BY_IMAGE,
  type PersonalizationOverlay,
} from "@/lib/data/personalizationOverlay";

type Img = { url: string; alt: string; type: string };

export default function Gallery({
  images,
  productName,
  personalization,
}: {
  images: Img[];
  productName: string;
  /** Nom/pseudo tapé dans AddToCart — superposé sur la photo quand une
   * position réelle a été calibrée pour l'image affichée. */
  personalization?: string;
}) {
  const { t } = useTranslation();
  const [active, setActive] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const current = images[active];
  const overlay = PERSONALIZATION_OVERLAY_BY_IMAGE[current.url];
  const ref = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [4, -4]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-4, 4]), { stiffness: 150, damping: 20 });

  function handleMouseMove(e: React.MouseEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  }

  function handleLeave() {
    mouseX.set(0.5);
    mouseY.set(0.5);
  }

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center bg-studio text-sm text-ink/40">
        {t("product.noImage")}
      </div>
    );
  }

  return (
    <div>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleLeave}
        style={{ rotateX, rotateY, transformPerspective: 1000 }}
        className="relative aspect-[4/5] overflow-hidden bg-studio will-change-transform"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={current.url}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            {overlay ? (
              <div className="flex h-full w-full items-center justify-center p-6">
                <div
                  className="relative w-full"
                  style={{ aspectRatio: overlay.aspectRatio, containerType: "size" }}
                >
                  <Image
                    src={current.url}
                    alt={current.alt || productName}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 55vw"
                    className="object-contain"
                  />
                  {personalization && (
                    <PersonalizationText overlay={overlay} text={personalization} />
                  )}
                </div>
              </div>
            ) : (
              <Image
                src={current.url}
                alt={current.alt || productName}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 55vw"
                className="object-contain p-6"
              />
            )}
          </motion.div>
        </AnimatePresence>
        {current.type === "MOCKUP" && (
          <span className="absolute bottom-3 left-3 bg-ink/85 px-2 py-1 text-label text-paper/80">
            {t("product.mockupBadge")}
          </span>
        )}
        <button
          onClick={() => setZoomOpen(true)}
          aria-label={t("product.zoomAlt")}
          className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center bg-ink/85 text-paper/80 transition-colors hover:text-paper"
        >
          <ZoomIcon />
        </button>
      </motion.div>

      <ImageZoomModal image={current} open={zoomOpen} onClose={() => setZoomOpen(false)} />
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <button
              key={img.url}
              onClick={() => setActive(i)}
              className={cn(
                "relative aspect-square overflow-hidden bg-studio",
                i === active ? "ring-2 ring-paper" : "opacity-60 hover:opacity-100"
              )}
              aria-label={t("product.viewImage", { number: i + 1 })}
            >
              <Image src={img.url} alt={img.alt || productName} fill sizes="80px" className="object-contain p-1.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Réduit le texte (sans jamais l'agrandir au-delà de la taille calibrée)
// pour qu'un pseudo long ne chevauche jamais le logo déjà présent sur la
// photo — mesure la largeur réellement rendue plutôt que de deviner d'après
// le nombre de caractères, pour rester correct quelle que soit la police.
function PersonalizationText({ overlay, text }: { overlay: PersonalizationOverlay; text: string }) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const span = spanRef.current;
    const wrapper = wrapperRef.current;
    if (!span || !wrapper) return;
    // `offsetWidth` ignore le `scale()` posé sur le wrapper parent (les
    // transforms ne changent pas le layout) : on mesure donc toujours la
    // largeur naturelle du texte à la taille de police calibrée, jamais une
    // valeur déjà réduite par un rendu précédent.
    const containerWidth = wrapper.parentElement?.clientWidth ?? 0;
    const naturalWidth = span.offsetWidth;
    if (!containerWidth || !naturalWidth) return;
    const maxWidth = (overlay.maxWidthPct / 100) * containerWidth;
    setScale(naturalWidth > maxWidth ? maxWidth / naturalWidth : 1);
  }, [text, overlay]);

  return (
    <span
      ref={wrapperRef}
      className="pointer-events-none absolute"
      style={{
        left: `${overlay.xPct}%`,
        top: `${overlay.yPct}%`,
        transform: `translate(-50%, -50%) scale(${scale})`,
      }}
    >
      <span
        ref={spanRef}
        className="whitespace-nowrap font-display uppercase leading-none"
        style={{ fontSize: `${overlay.fontSizePct}cqh`, color: overlay.color }}
      >
        {text}
      </span>
    </span>
  );
}

function ZoomIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="7" cy="7" r="5.2" stroke="currentColor" strokeWidth="1.3" />
      <line x1="10.8" y1="10.8" x2="15" y2="15" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="7" y1="4.5" x2="7" y2="9.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <line x1="4.5" y1="7" x2="9.5" y2="7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
