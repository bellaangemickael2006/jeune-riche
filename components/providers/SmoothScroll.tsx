"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

export default function SmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Sur mobile/tablette, le défilement natif (inertie du système) est déjà
    // le plus fluide possible : Lenis n'y lisse rien et n'ajouterait que des
    // écouteurs. Il ne sert qu'à la molette et au pavé tactile sur ordinateur.
    if (window.matchMedia("(pointer: coarse)").matches) return;

    // Lenis pilote sa propre boucle d'animation (autoRaf). Avant, il était
    // branché sur le ticker GSAP — chargé uniquement pour ça — et le
    // nettoyage retirait une autre fonction que celle ajoutée : à chaque
    // passage admin → site, une boucle de plus continuait de tourner.
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      autoRaf: true,
    });
    lenisRef.current = lenis;
    // Exposé globalement pour que les panneaux (panier, recherche, zoom...)
    // puissent mettre le défilement en pause pendant qu'ils sont ouverts —
    // voir lib/scrollLock.ts. Un seul Lenis existe pour tout le site.
    window.__lenis = lenis;

    return () => {
      lenis.destroy();
      lenisRef.current = null;
      if (window.__lenis === lenis) window.__lenis = undefined;
    };
  }, []);

  // Next.js ne recharge jamais la page en changeant de route (navigation
  // client-side) : sans ce reset, arriver sur une page plus courte que
  // l'endroit où on avait défilé fait atterrir directement en bas.
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true });
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
