"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

type Img = { url: string; alt: string; type: string };

export default function Gallery({ images, productName }: { images: Img[]; productName: string }) {
  const [active, setActive] = useState(0);
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
        <Image
          src={current.url}
          alt={current.alt || productName}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain p-8"
        />
        {current.type === "MOCKUP" && (
          <span className="absolute bottom-3 left-3 bg-ink/85 px-2 py-1 text-[10px] uppercase tracking-widest2 text-paper/80">
            Référence de design — photo produit à venir
          </span>
        )}
      </motion.div>
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
