"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import {
  PERSONALIZATION_OVERLAY_BY_IMAGE,
  type PersonalizationOverlay,
} from "@/lib/data/personalizationOverlay";
import { cn } from "@/lib/utils";

// Rendu d'une pièce avec, le cas échéant, le nom composé à l'endroit exact
// où il sera imprimé. Extrait de Gallery : l'atelier et la galerie partagent
// désormais le même calibrage au lieu d'en dupliquer la logique — une seule
// source pour les coordonnées, une seule à corriger le jour où une photo est
// recalibrée.
//
// Les coordonnées viennent de lib/data/personalizationOverlay.ts, mesurées
// pixel à pixel sur les vraies photos. Une image non calibrée s'affiche sans
// superposition plutôt qu'avec un nom placé au hasard.
export function hasPersonalizationOverlay(url: string) {
  return Boolean(PERSONALIZATION_OVERLAY_BY_IMAGE[url]);
}

export default function PersonalizedPiece({
  src,
  alt,
  text,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 50vw",
  className,
  padding = "p-6",
}: {
  src: string;
  alt: string;
  text?: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
  padding?: string;
}) {
  const overlay = PERSONALIZATION_OVERLAY_BY_IMAGE[src];
  const trimmed = text?.trim();

  if (!overlay) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={cn("object-contain", padding, className)}
      />
    );
  }

  return (
    <div className={cn("flex h-full w-full items-center justify-center", padding)}>
      {/* containerType: size — la taille de police du nom est exprimée en
          `cqh` (pourcentage de la hauteur du conteneur), donc le rendu suit
          l'image à toutes les tailles d'écran sans recalcul. */}
      <div
        className="relative w-full"
        style={{ aspectRatio: overlay.aspectRatio, containerType: "size" }}
      >
        <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-contain" />
        {trimmed && <PersonalizationText overlay={overlay} text={trimmed} />}
      </div>
    </div>
  );
}

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
    // largeur naturelle du texte à la taille calibrée, jamais une valeur
    // déjà réduite par un rendu précédent.
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
