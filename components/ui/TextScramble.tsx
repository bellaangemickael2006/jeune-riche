"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export default function TextScramble({
  text,
  className,
  duration = 900,
  immediate = false,
}: {
  text: string;
  className?: string;
  duration?: number;
  /** Joue au montage plutôt qu'à l'entrée dans le viewport — pour le contenu
   * visible dès le premier écran (hero), où useInView n'est pas fiable. */
  immediate?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inViewport = useInView(ref, { once: true, margin: "-10% 0px" });
  const inView = immediate || inViewport;
  const [display, setDisplay] = useState(text);
  const reduced = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (!inView || reduced.current) return;

    const start = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const revealCount = Math.floor(progress * text.length);

      setDisplay(
        text
          .split("")
          .map((char, i) => {
            if (char === " ") return " ";
            if (i < revealCount) return char;
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join("")
      );

      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setDisplay(text);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, text, duration]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
