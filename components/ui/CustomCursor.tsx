"use client";

import { useEffect, useRef } from "react";

const INTERACTIVE_SELECTOR = "a, button, [role='button'], input, textarea, select";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

    const dot = dotRef.current;
    const scale = scaleRef.current;
    if (!dot || !scale) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let hover = false;
    let rafId: number;

    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
    };

    const over = (e: PointerEvent) => {
      const target = e.target as Element | null;
      hover = Boolean(target?.closest(INTERACTIVE_SELECTOR));
    };

    // La position (translate) est appliquée à chaque frame sans aucune
    // transition CSS — un transform qui rattrape une valeur déjà en train de
    // bouger produit un effet de traînée, pas de fluidité. Seul le
    // grossissement au survol (état discret, pas continu) vit sur un
    // élément séparé qui garde sa transition CSS.
    const render = () => {
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      scale.style.transform = `scale(${hover ? 2.2 : 1})`;
      rafId = requestAnimationFrame(render);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerover", over);
    rafId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={dotRef}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[100] hidden h-4 w-4 -translate-x-1/2 -translate-y-1/2 md:block"
    >
      <div
        ref={scaleRef}
        className="cursor-dot h-full w-full rounded-full bg-paper transition-transform duration-150 ease-out"
      />
    </div>
  );
}
