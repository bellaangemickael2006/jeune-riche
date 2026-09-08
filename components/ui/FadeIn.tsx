"use client";

import { motion } from "framer-motion";
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
  const motionProps = immediate
    ? { initial: { opacity: 0, x, y }, animate: { opacity: 1, x: 0, y: 0 } }
    : {
        initial: { opacity: 0, x, y },
        whileInView: { opacity: 1, x: 0, y: 0 },
        viewport: { once, margin: "-10% 0px" },
      };

  return (
    <motion.div
      {...motionProps}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
