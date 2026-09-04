"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Img = { url: string; alt: string; type: string };

export default function Gallery({ images, productName }: { images: Img[]; productName: string }) {
  const [active, setActive] = useState(0);
  const current = images[active];

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center bg-line text-sm text-paper/40">
        Aucune image disponible
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden bg-line">
        <Image
          src={current.url}
          alt={current.alt || productName}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
        {current.type === "MOCKUP" && (
          <span className="absolute bottom-3 left-3 bg-ink/80 px-2 py-1 text-[10px] uppercase tracking-widest2 text-paper/80">
            Référence de design — photo produit à venir
          </span>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <button
              key={img.url}
              onClick={() => setActive(i)}
              className={cn(
                "relative aspect-square overflow-hidden bg-line",
                i === active ? "ring-2 ring-paper" : "opacity-60 hover:opacity-100"
              )}
              aria-label={`Voir l'image ${i + 1}`}
            >
              <Image src={img.url} alt={img.alt || productName} fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
