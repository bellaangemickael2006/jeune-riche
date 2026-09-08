"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
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

export default function IntroOverlay() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const lastSeenAt = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    if (Date.now() - lastSeenAt < REPLAY_INTERVAL_MS) return;

    setVisible(true);
    const timer = setTimeout(() => dismiss(), 3200);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ clipPath: "circle(150% at 50% 50%)" }}
          animate={{ clipPath: "circle(150% at 50% 50%)" }}
          exit={{ clipPath: "circle(0% at 50% 50%)" }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-ink"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <Image
              src="/images/logo/logo-transparent.png"
              alt="JEUNE RICHE"
              width={200}
              height={200}
              className="h-28 w-28 object-contain md:h-36 md:w-36"
              priority
            />
          </motion.div>
          <button
            onClick={dismiss}
            className="absolute bottom-10 right-10 text-xs uppercase tracking-widest2 text-paper/60 transition-colors hover:text-paper"
          >
            Passer
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
