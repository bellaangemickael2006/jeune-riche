"use client";

import { useEffect } from "react";
import type Lenis from "lenis";

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

// Un site e-commerce sérieux bloque le défilement de la page derrière un
// panneau ouvert (panier, recherche, menu mobile, zoom photo). Lenis
// intercepte la molette/le tactile lui-même (voir SmoothScroll.tsx), donc
// overflow:hidden seul ne suffit pas côté desktop — il faut aussi arrêter
// Lenis explicitement via l'instance qu'il expose sur window.
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const lenis = window.__lenis;
    lenis?.stop();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      lenis?.start();
      document.body.style.overflow = previousOverflow;
    };
  }, [active]);
}
