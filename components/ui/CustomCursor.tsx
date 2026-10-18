"use client";

import { useEffect, useRef } from "react";

const INTERACTIVE_SELECTOR = "a, button, [role='button'], input, textarea, select, label";
const SIZE = 16; // px — doit correspondre à h-4 w-4 ci-dessous

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

    const dot = dotRef.current;
    const scale = scaleRef.current;
    if (!dot || !scale) return;

    let x = -100;
    let y = -100;
    let hover = false;
    let rafId = 0;

    // Une seule écriture par frame, et seulement quand la souris a bougé :
    // l'ancienne boucle tournait en permanence (60 écritures de style par
    // seconde, souris immobile comprise), ce qui grignotait le budget de
    // chaque frame pendant le défilement.
    const render = () => {
      rafId = 0;
      // Centré sur le pointeur : le translate inline remplaçait les classes
      // -translate-x/y-1/2, le point était décalé de 8 px en bas à droite.
      dot.style.transform = `translate3d(${x - SIZE / 2}px, ${y - SIZE / 2}px, 0)`;
    };
    const schedule = () => {
      if (!rafId) rafId = requestAnimationFrame(render);
    };

    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      dot.style.opacity = "1";
      schedule();
    };

    const over = (e: PointerEvent) => {
      const next = Boolean((e.target as Element | null)?.closest(INTERACTIVE_SELECTOR));
      if (next === hover) return;
      hover = next;
      scale.style.transform = `scale(${hover ? 2.2 : 1})`;
    };

    const leave = () => {
      dot.style.opacity = "0";
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      document.documentElement.removeEventListener("pointerleave", leave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={dotRef}
      aria-hidden
      style={{ opacity: 0 }}
      className="pointer-events-none fixed left-0 top-0 z-[100] hidden h-4 w-4 transition-opacity duration-200 will-change-transform md:block"
    >
      <div
        ref={scaleRef}
        className="cursor-dot h-full w-full rounded-full bg-paper transition-transform duration-150 ease-out"
      />
    </div>
  );
}
