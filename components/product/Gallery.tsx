"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import ImageZoomModal from "@/components/product/ImageZoomModal";

type Img = { url: string; alt: string; type: string };

// Le tilt 3D au survol de la photo a été retiré : la fiche produit doit donner
// son poids à la photographie, pas à un effet de carte qui la fait bouger. Le
// seul mouvement conservé est le fondu entre deux vues, qui sert la lecture.
//
// Cadre en 5/4 : les 27 visuels produit disponibles sont tous en paysage
// (1600×1280 pour la plupart). Dans un cadre portrait 4/5, le vêtement était
// systématiquement réduit et perdu au centre.
export default function Gallery({ images, productName }: { images: Img[]; productName: string }) {
  const [active, setActive] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const current = images[active];

  if (images.length === 0) {
    return (
      <div className="flex aspect-[5/4] items-center justify-center bg-studio text-caption text-ink/40">
        Aucune image disponible
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-[5/4] overflow-hidden bg-studio">
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
        {/* Phrase explicative, pas un label : elle reste en sans neutre. */}
        {current.type === "MOCKUP" && (
          <span className="absolute bottom-3 left-3 bg-ink/85 px-2 py-1 text-caption text-paper/80">
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
      </div>

      <ImageZoomModal image={current} open={zoomOpen} onClose={() => setZoomOpen(false)} />
      {images.length > 1 && (
        // Vignettes au même format que la photo principale, et pas en carré :
        // un carré recadrait mentalement des visuels qui n'en sont pas.
        // Sélection marquée par un filet, pas par un anneau de 2px.
        <div className="mt-3 grid grid-cols-4 gap-3 md:grid-cols-5">
          {images.map((img, i) => (
            <button
              key={img.url}
              onClick={() => setActive(i)}
              aria-current={i === active ? "true" : undefined}
              className={cn(
                "relative aspect-[5/4] overflow-hidden bg-studio transition-opacity duration-300 ease-editorial",
                i === active
                  ? "outline outline-1 outline-offset-2 outline-paper"
                  : "opacity-50 hover:opacity-100"
              )}
              aria-label={`Voir l'image ${i + 1}`}
            >
              <Image src={img.url} alt={img.alt || productName} fill sizes="120px" className="object-contain" />
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
