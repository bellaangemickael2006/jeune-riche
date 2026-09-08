"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { getGsap } from "@/lib/gsap";

export default function SmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;
    // Exposé globalement pour que les panneaux (panier, recherche, zoom...)
    // puissent mettre le défilement en pause pendant qu'ils sont ouverts —
    // voir lib/scrollLock.ts. Pas de contexte React ici pour rester simple :
    // un seul Lenis existe pour tout le site.
    window.__lenis = lenis;

    const { gsap, ScrollTrigger } = getGsap();

    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      lenisRef.current = null;
      gsap.ticker.remove(lenis.raf);
    };
  }, []);

  // Next.js ne recharge jamais la page en changeant de route (navigation
  // client-side) : Lenis garde donc la position de scroll de la page
  // précédente. Sans ce reset, arriver sur une page plus courte que l'endroit
  // où on avait défilé fait atterrir directement en bas (le scroll natif se
  // cale sur le maximum disponible) — exactement le bug remonté en clic sur
  // une fiche produit depuis un catalogue déjà défilé.
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true });
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
