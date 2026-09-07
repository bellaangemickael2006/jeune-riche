"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import ImageZoomModal from "@/components/product/ImageZoomModal";

type Img = { url: string; alt: string; type: string };

export default function Gallery({ images, productName }: { images: Img[]; productName: string }) {
  const [active, setActive] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const current = images[active];
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
        Aucune image disponible
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
            <Image
              src={current.url}
              alt={current.alt || productName}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 55vw"
              className="object-contain p-6"
            />
          </motion.div>
        </AnimatePresence>
        {current.type === "MOCKUP" && (
          <span className="absolute bottom-3 left-3 bg-ink/85 px-2 py-1 text-label text-paper/80">
            Référence de design — photo produit à venir
          </span>
        )}
        <button
          onClick={() => setZoomOpen(true)}
          aria-label="Zoomer sur la photo"
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
              aria-label={`Voir l'image ${i + 1}`}
            >
              <Image src={img.url} alt={img.alt || productName} fill sizes="80px" className="object-contain p-1.5" />
            </button>
          ))}
        </div>
      )}
    </div>
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
