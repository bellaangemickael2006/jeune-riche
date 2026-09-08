"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

// GSAP et son plugin ScrollTrigger étaient importés ici uniquement pour
// piloter la boucle `raf` de Lenis et appeler `ScrollTrigger.update()`. Or
// aucune animation ScrollTrigger n'existait nulle part dans le projet
// (vérifié : zéro occurrence hors du module d'initialisation), et Lenis a sa
// propre boucle. Deux bibliothèques d'animation chargées pour un
// requestAnimationFrame — retirées, avec `lib/gsap.ts`.
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

    let rafId = 0;
    function frame(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
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
