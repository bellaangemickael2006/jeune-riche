"use client";

import { useEffect, useRef } from "react";

const INTERACTIVE_SELECTOR = "a, button, [role='button'], input, textarea, select";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

    const dot = dotRef.current;
    if (!dot) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rafId: number;

    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
    };

    const over = (e: PointerEvent) => {
      const target = e.target as Element | null;
      dot.dataset.hover = target?.closest(INTERACTIVE_SELECTOR) ? "true" : "false";
    };

    const render = () => {
      dot.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${
        dot.dataset.hover === "true" ? 2.2 : 1
      })`;
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
      className="cursor-dot pointer-events-none fixed left-0 top-0 z-[100] hidden h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper transition-transform duration-150 ease-out md:block"
    />
  );
}
