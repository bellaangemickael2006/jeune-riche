"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const MIN_DISPLAY_MS = 1400;

// Ne s'affiche qu'au lancement de l'app installée (icône ajoutée à l'écran
// d'accueil, "display-mode: standalone") — jamais sur une visite web
// classique dans un onglet, où un délai de marque artificiel pénaliserait la
// performance perçue pour rien. `mounted` évite tout flash/mismatch
// d'hydratation : le rendu serveur et le tout premier rendu client sont
// toujours vides, l'overlay n'apparaît qu'ensuite si l'app tourne en
// standalone.
export default function SplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (!isStandalone) return;

    setVisible(true);
    const timer = setTimeout(() => setVisible(false), MIN_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted || !visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-10 bg-ink">
      <Image
        src="/images/logo/logo-transparent.png"
        alt="JEUNE RICHE"
        width={797}
        height={778}
        priority
        className="h-auto w-40"
      />
      <p className="animate-pulse text-xs uppercase tracking-widest2 text-paper/50">
        Chargement de la boutique...
      </p>
    </div>
  );
}
