"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { getGsap } from "@/lib/gsap";

export type ShowcaseItem = {
  name: string;
  slug: string;
  image: string | null;
};

const HIGHLIGHT_EVERY_MS = 3400;

export default function ProductShowcase({ items }: { items: ShowcaseItem[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced || !trackRef.current) return;

      const { gsap } = getGsap();
      const total = items.length;

      // Défilement continu façon ticker — la piste contient deux copies de
      // la liste bout à bout, on translate exactement de la moitié pour une
      // boucle parfaitement invisible.
      const marquee = gsap.to(trackRef.current, {
        xPercent: -50,
        duration: 34,
        ease: "none",
        repeat: -1,
      });

      let logicalIndex = 0;

      // Toutes les quelques secondes, la piste se fige et une pièce (les
      // deux copies visibles ou non) se soulève brièvement, comme si elle
      // était présentée au visiteur, avant que le défilement ne reprenne.
      const interval = window.setInterval(() => {
        const a = cardRefs.current[logicalIndex];
        const b = cardRefs.current[logicalIndex + total];
        const targets = [a, b].filter(Boolean) as HTMLAnchorElement[];
        logicalIndex = (logicalIndex + 1) % total;
        if (targets.length === 0) return;

        marquee.pause();
        gsap
          .timeline({
            onComplete: () => {
              marquee.play();
            },
          })
          .to(targets, { y: -20, scale: 1.06, duration: 0.55, ease: "power2.out" })
          .to(targets, { y: 0, scale: 1, duration: 0.5, ease: "power2.in" }, "+=0.85");
      }, HIGHLIGHT_EVERY_MS);

      return () => window.clearInterval(interval);
    },
    { scope: containerRef, dependencies: [items.length] }
  );

  return (
    <div ref={containerRef} className="overflow-hidden py-2">
      <div ref={trackRef} className="flex w-max gap-4 md:gap-5">
        {[...items, ...items].map((item, i) => (
          <Link
            key={i}
            href={`/catalogue/${item.slug}`}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className="group relative block h-44 w-32 shrink-0 overflow-hidden bg-studio will-change-transform md:h-60 md:w-44"
          >
            {item.image ? (
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="176px"
                className="object-contain p-3 transition-transform duration-700 ease-editorial group-hover:scale-105"
              />
            ) : (
              <div className="h-full w-full bg-line" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
            <p className="absolute bottom-3 left-3 font-display text-sm uppercase text-paper md:text-base">
              {item.name}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
