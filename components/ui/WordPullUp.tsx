"use client";

import { motion } from "framer-motion";
import { Fragment } from "react";

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

  return (
    <Tag className={className} aria-label={text}>
      {words.map((word, i) => {
        const motionProps = immediate
          ? { initial: { y: "110%" }, animate: { y: "0%" } }
          : {
              initial: { y: "110%" },
              whileInView: { y: "0%" },
              viewport: { once: true, margin: "-10% 0px" },
            };

        return (
          <Fragment key={i}>
            <span className="inline-block overflow-hidden align-bottom">
              <motion.span
                className="inline-block"
                {...motionProps}
                transition={{ duration: 0.7, delay: i * stagger, ease: [0.16, 1, 0.3, 1] }}
                aria-hidden
              >
                {word}
              </motion.span>
            </span>
            {i < words.length - 1 ? " " : ""}
          </Fragment>
        );
      })}
    </Tag>
  );
}
