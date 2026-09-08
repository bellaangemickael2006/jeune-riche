"use client";

import Image from "next/image";
import { useState } from "react";
import ImageZoomModal from "@/components/product/ImageZoomModal";

type Img = { url: string; alt: string; type: string };

// Les vues sont empilées, pas réduites à une grande image surmontant une
// rangée de miniatures minuscules — c'est la présentation demandée par la
// direction artistique, et c'est aussi ce qui donne enfin son poids à la
// photographie : le tilt 3D au survol a été retiré, la colonne de gauche vaut
// désormais par la surface qu'occupe le vêtement.
//
// Cadres en 5/4 : les 27 visuels produit disponibles sont tous en paysage
// (1600×1280 pour la plupart). Dans un cadre portrait, le vêtement était
// systématiquement réduit et perdu au centre d'un aplat de studio.
export default function Gallery({ images, productName }: { images: Img[]; productName: string }) {
  const [zoom, setZoom] = useState<Img | null>(null);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[5/4] items-center justify-center bg-studio text-caption text-ink/40">
        Aucune image disponible
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {images.map((img, i) => (
        <button
          key={img.url}
          type="button"
          onClick={() => setZoom(img)}
          aria-label={`Agrandir la vue ${i + 1} sur ${images.length}`}
          className="group relative aspect-[5/4] w-full cursor-zoom-in overflow-hidden bg-studio"
        >
          <Image
            src={img.url}
            alt={img.alt || productName}
            fill
            priority={i === 0}
            sizes="(max-width: 768px) 100vw, 55vw"
            className="object-contain"
          />
          {img.type === "MOCKUP" && (
            // Phrase explicative, pas un label : elle reste en sans neutre.
            <span className="absolute bottom-3 left-3 bg-ink/85 px-2 py-1 text-caption text-paper/80">
              Référence de design — photo produit à venir
            </span>
          )}
          <span
            aria-hidden
            className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center bg-ink/85 text-paper/70 transition-colors duration-300 ease-editorial group-hover:text-paper"
          >
            <ZoomIcon />
          </span>
        </button>
      ))}

      <ImageZoomModal image={zoom} open={zoom !== null} onClose={() => setZoom(null)} />
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
