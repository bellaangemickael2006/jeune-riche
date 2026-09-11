"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Apparition au défilement — reconstruite pour être sûre plutôt que jolie.
//
// L'ancienne version rendait le contenu à opacity:0 côté serveur et comptait
// sur framer-motion pour le révéler. Conséquence : si le JavaScript tarde,
// échoue, ou si le navigateur gèle les frames (onglet en arrière-plan,
// économie d'énergie, appareil lent), le contenu restait invisible pour de
// bon — sur le catalogue, cela voulait dire une page de boutique vide.
//
// Désormais l'état de repos est VISIBLE. Le masquage n'est appliqué qu'une
// fois le composant monté, c'est-à-dire seulement si JavaScript tourne
// réellement et peut donc aussi le révéler. Sans JS, le contenu s'affiche.
//
// L'observation utilise un IntersectionObserver natif plutôt que le suivi de
// viewport de framer-motion, et la transition passe par CSS : les deux
// continuent de fonctionner quand la boucle d'animation est ralentie.
export default function FadeIn({
  children,
  delay = 0,
  duration = 0.8,
  x = 0,
  y = 24,
  once = true,
  immediate = false,
  className,
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  x?: number;
  y?: number;
  once?: boolean;
  /** Révèle au montage plutôt qu'à l'entrée dans le viewport — pour le
   * contenu déjà visible au premier écran. */
  immediate?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (immediate) {
      setInView(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin: "-8% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [immediate, once]);

  const hidden = mounted && !inView;

  return (
    <div
      ref={ref}
      className={cn("motion-reduce:!translate-x-0 motion-reduce:!translate-y-0 motion-reduce:!opacity-100", className)}
      style={{
        opacity: hidden ? 0 : 1,
        transform: hidden ? `translate3d(${x}px, ${y}px, 0)` : "translate3d(0, 0, 0)",
        transition: `opacity ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}
