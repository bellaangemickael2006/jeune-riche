"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "jr-intro-seen-at";
// Le fait de se baser sur sessionStorage posait un piège spécifique à Safari
// iOS : contrairement à Chrome desktop, iOS restaure très souvent l'onglet
// (et donc sessionStorage) après un simple relancement de l'app, si bien que
// l'intro ne se rejouait plus jamais sur un même téléphone après la toute
// première visite — donnant l'impression que l'animation avait disparu. On
// utilise à la place localStorage avec une expiration explicite qu'on
// contrôle nous-mêmes, indépendamment du comportement de stockage du navigateur.
const REPLAY_INTERVAL_MS = 12 * 60 * 60 * 1000;

// Durée totale ramenée de 3,2 s à 1,3 s avant le fondu de sortie.
//
// L'intro est tolérée par la direction artistique à quatre conditions : très
// courte, une seule idée, sortie immédiate possible, aucun écran noir prolongé.
// La version précédente en échouait trois — 3,2 secondes de noir plein cadre,
// un bouton « Passer » relégué dans le coin bas-droit à 60% d'opacité (donc
// difficile à voir et à viser au pouce sur un téléphone), et le crest utilisé
// comme écran d'attente. Ici : le crest apparaît une fois, lentement, la barre
// de progression rend l'attente lisible plutôt que subie, et n'importe quel
// clic ou la touche Échap sortent immédiatement.
const HOLD_MS = 1300;

export default function IntroOverlay() {
  const [visible, setVisible] = useState(false);

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setVisible(false);
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const lastSeenAt = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    if (Date.now() - lastSeenAt < REPLAY_INTERVAL_MS) return;

    setVisible(true);
    const timer = setTimeout(dismiss, HOLD_MS);
    return () => clearTimeout(timer);
  }, [dismiss]);

  useEffect(() => {
    if (!visible) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, dismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          // Toute la surface est un bouton de sortie : sur un téléphone, viser
          // un petit lien dans un coin en 1,3 seconde n'est pas réaliste.
          role="button"
          tabIndex={0}
          aria-label="Passer l'introduction"
          onClick={dismiss}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[200] flex cursor-pointer flex-col items-center justify-center bg-ink"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <Image
              src="/images/logo/logo-transparent.png"
              alt="JEUNE RICHE"
              width={200}
              height={200}
              className="h-24 w-24 object-contain md:h-32 md:w-32"
              priority
            />
          </motion.div>

          {/* Un filet qui se remplit : l'attente devient lisible, et la barre
              dit d'elle-même que c'est court. Purement décorative — aucune
              information ne dépend d'elle. */}
          <div aria-hidden className="mt-10 h-px w-28 overflow-hidden bg-line">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: HOLD_MS / 1000, ease: "linear" }}
              className="h-full w-full origin-left bg-paper/60"
            />
          </div>

          <span className="absolute bottom-10 left-1/2 -translate-x-1/2 text-label text-paper/45">
            Passer
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
