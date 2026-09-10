"use client";

import { motion } from "framer-motion";
import { Fragment, useEffect, useRef, useState } from "react";

export default function WordPullUp({
  text,
  className,
  as: Tag = "span",
  stagger = 0.06,
  immediate = false,
}: {
  text: string;
  className?: string;
  as?: "span" | "h1" | "h2" | "p";
  stagger?: number;
  /** Anime au montage plutôt qu'à l'entrée dans le viewport — pour le contenu
   * visible dès le premier écran (hero), où whileInView n'est pas fiable. */
  immediate?: boolean;
}) {
  const words = text.split(" ");
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(immediate);

  // whileInView de Framer Motion (IntersectionObserver interne) reste parfois
  // bloqué à l'état initial même quand l'élément est bel et bien visible à
  // l'écran — repéré sur ce titre ("Nos pièces"), resté invisible en
  // permanence chez de vrais visiteurs. Un IntersectionObserver posé
  // nous-mêmes, vérifié fiable dans les mêmes conditions, remplace
  // whileInView plutôt que d'en dépendre.
  useEffect(() => {
    if (immediate) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "-10% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [immediate]);

  return (
    <Tag ref={ref as never} className={className} aria-label={text}>
      {words.map((word, i) => (
        <Fragment key={i}>
          <span className="inline-block overflow-hidden align-bottom">
            <motion.span
              className="inline-block"
              initial={{ y: "110%" }}
              animate={{ y: inView ? "0%" : "110%" }}
              transition={{ duration: 0.7, delay: i * stagger, ease: [0.16, 1, 0.3, 1] }}
              aria-hidden
            >
              {word}
            </motion.span>
          </span>
          {i < words.length - 1 ? " " : ""}
        </Fragment>
      ))}
    </Tag>
  );
}
