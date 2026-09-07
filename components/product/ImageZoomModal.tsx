"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useScrollLock } from "@/lib/scrollLock";

type Img = { url: string; alt: string };

// Zoom en plein écran, calé sur la position du curseur — pensé pour un
// mockup produit unique (pas une galerie à faire défiler dans la modale) :
// l'objectif est de voir un détail (le motif brodé) en grand, pas de
// naviguer entre les photos, ce que la galerie derrière permet déjà.
export default function ImageZoomModal({
  image,
  open,
  onClose,
}: {
  image: Img | null;
  open: boolean;
  onClose: () => void;
}) {
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const containerRef = useRef<HTMLDivElement>(null);
  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setZoomed(false);
  }, [open]);

  function handleMouseMove(e: React.MouseEvent) {
    if (!zoomed) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  }

  if (!image) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] bg-ink/95"
          onClick={onClose}
        >
          <button
            onClick={onClose}
            aria-label="Fermer le zoom"
            className="absolute right-5 top-5 z-10 text-label text-paper/70 hover:text-paper"
          >
            Fermer ×
          </button>
          <div
            ref={containerRef}
            onClick={(e) => {
              e.stopPropagation();
              setZoomed((v) => !v);
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setZoomed(false)}
            className="flex h-full w-full items-center justify-center overflow-hidden p-8 md:p-16"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- zoom natif simple, pas besoin d'optimisation next/image ici */}
            <img
              src={image.url}
              alt={image.alt}
              className="max-h-full max-w-full object-contain transition-transform duration-200 ease-out"
              style={{
                cursor: zoomed ? "zoom-out" : "zoom-in",
                transform: zoomed ? "scale(2.2)" : "scale(1)",
                transformOrigin: origin,
              }}
            />
          </div>
          <p className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 text-caption text-paper/40">
            {zoomed ? "Cliquez pour dézoomer" : "Cliquez pour zoomer"}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
