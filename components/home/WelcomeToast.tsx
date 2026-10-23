"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";

// Affiché sur la page d'accueil juste après confirmation d'inscription
// (voir app/compte/confirmation/page.tsx, qui redirige vers /?welcome=1).
// On lit l'URL directement (pas useSearchParams + router.replace) : un
// router.replace() ici redéclenche une navigation Next.js/RSC qui peut
// remonter ce composant et effacer son état AVANT que le toast n'ait eu le
// temps de s'afficher. history.replaceState nettoie l'URL sans y toucher.
export default function WelcomeToast() {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("welcome") !== "1") return;

    setShow(true);

    url.searchParams.delete("welcome");
    window.history.replaceState({}, "", url.pathname + url.search);

    const timer = setTimeout(() => setShow(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed left-1/2 top-6 z-100 w-[calc(100%-2.5rem)] max-w-sm -translate-x-1/2 border border-line bg-ink px-6 py-4 text-center shadow-xl"
        >
          <p className="text-[11px] uppercase tracking-widest2 text-paper/70">{t("home.welcomeToastTitle")}</p>
          <p className="mt-1 font-editorial text-base text-paper">{t("home.welcomeToastMessage")}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
