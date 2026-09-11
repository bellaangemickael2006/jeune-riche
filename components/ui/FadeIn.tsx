"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

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
  /** Anime au montage plutôt qu'à l'entrée dans le viewport — pour le contenu
   * visible dès le premier écran (hero), où whileInView n'est pas fiable. */
  immediate?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(immediate);

  // whileInView de Framer Motion (IntersectionObserver interne) reste parfois
  // bloqué à l'état initial même quand l'élément est bel et bien visible à
  // l'écran — repéré sur "Nos pièces" et les vignettes produit de l'accueil,
  // restées invisibles en permanence chez de vrais visiteurs. Un
  // IntersectionObserver posé nous-mêmes sur l'élément, vérifié fiable dans
  // les mêmes conditions, remplace whileInView plutôt que d'en dépendre.
  useEffect(() => {
    if (immediate) return;
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
      { rootMargin: "-10% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [immediate, once]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x, y }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x, y }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
