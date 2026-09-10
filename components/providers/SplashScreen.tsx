"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const DURATION_MS = 1600;
const HOLD_AT_100_MS = 200; // laisse le temps de VOIR "100%" avant de disparaître
const FADE_MS = 350;

type Phase = "loading" | "closing" | "hidden";

// Progression non linéaire (ease-out) plutôt qu'un minuteur mécanique : vite
// au départ, ralentit juste avant 100% — l'impression d'un vrai chargement,
// comme les écrans de démarrage natifs iOS/Android, pas une barre qui avance
// à vitesse constante.
function easeOutQuart(t: number) {
  return 1 - Math.pow(1 - t, 4);
}

// Ne s'affiche qu'au lancement de l'app installée (icône ajoutée à l'écran
// d'accueil, "display-mode: standalone") — jamais sur une visite web
// classique dans un onglet, où un délai de marque artificiel pénaliserait la
// performance perçue pour rien. `mounted` évite tout flash/mismatch
// d'hydratation : le rendu serveur et le tout premier rendu client sont
// toujours vides, l'overlay n'apparaît qu'ensuite si l'app tourne en
// standalone.
export default function SplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<Phase>("hidden");
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (!isStandalone) return;

    setPhase("loading");
    const start = performance.now();

    function tick(now: number) {
      const t = Math.min((now - start) / DURATION_MS, 1);
      setProgress(Math.round(easeOutQuart(t) * 100));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      setTimeout(() => setPhase("closing"), HOLD_AT_100_MS);
      setTimeout(() => setPhase("hidden"), HOLD_AT_100_MS + FADE_MS);
    }
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (!mounted || phase === "hidden") return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-8 bg-ink transition-opacity ease-editorial"
      style={{ transitionDuration: `${FADE_MS}ms`, opacity: phase === "closing" ? 0 : 1 }}
    >
      <Image
        src="/images/logo/logo-transparent.png"
        alt="JEUNE RICHE"
        width={797}
        height={778}
        priority
        className="h-auto w-40"
      />
      <div className="flex flex-col items-center gap-3">
        <div className="h-px w-40 overflow-hidden bg-paper/15">
          <div className="h-full bg-paper" style={{ width: `${progress}%` }} />
        </div>
        {/* whitespace-nowrap : ce libellé est plus large que la barre de
            progression (160px) — sans ça il retombe sur 3 lignes et le
            pourcentage se retrouve collé à la dernière au lieu de suivre le
            texte sur une seule ligne. */}
        <div className="flex items-center gap-2 whitespace-nowrap text-[11px] uppercase tracking-widest2">
          <span className="text-paper/50">Chargement de la boutique</span>
          <span className="tabular-nums text-paper">{progress}%</span>
        </div>
      </div>
    </div>
  );
}
