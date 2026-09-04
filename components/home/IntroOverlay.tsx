"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SESSION_KEY = "jr-intro-seen";

export default function IntroOverlay() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = sessionStorage.getItem(SESSION_KEY);
    if (seen || reduced) return;

    setVisible(true);
    const timer = setTimeout(() => dismiss(), 3200);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, "1");
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-ink"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <Image
              src="/images/logo/logo-white-on-black.png"
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
