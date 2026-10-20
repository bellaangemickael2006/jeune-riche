"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { createClient } from "@/lib/supabase/client";

const DISPLAY_MS = 2200;

// Affiché sur l'accueil juste après une connexion réussie (voir
// components/account/AuthForms.tsx, qui redirige vers /?login=1) — une
// prise d'écran centrale et marquante plutôt qu'un simple bandeau, sur le
// modèle demandé ("au milieu du site"). Le paramètre est retiré de l'URL dès
// l'affichage pour ne jamais réapparaître sur un rafraîchissement ou un
// retour arrière. Même logique que WelcomeToast (confirmation d'inscription)
// mais volontairement plus imposant : ce n'est pas le même moment pour le
// client (retour vs première fois).
export default function LoginWelcome() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("login") !== "1") return;

    setVisible(true);
    url.searchParams.delete("login");
    window.history.replaceState({}, "", url.pathname + url.search);

    createClient()
      .auth.getUser()
      .then(({ data }) => {
        const fullName = (data.user?.user_metadata?.name as string | undefined)?.trim();
        setName(fullName ? fullName.split(" ")[0] : null);
      })
      .catch(() => {
        // Best-effort : sans prénom, le message générique suffit.
      });

    const timer = setTimeout(() => setVisible(false), DISPLAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-150 flex items-center justify-center bg-ink/95 backdrop-blur-xs"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-6 px-6 text-center"
          >
            <Image
              src="/images/logo/logo-transparent.png"
              alt="JEUNE RICHE"
              width={200}
              height={195}
              priority
              className="h-16 w-auto"
            />
            <div>
              <p className="text-xs uppercase tracking-widest2 text-paper/50">{t("account.welcomeBack")}</p>
              <p className="mt-2 font-editorial text-2xl text-paper">
                {name ? t("home.loginWelcomeMessageNamed", { name }) : t("home.loginWelcomeMessage")}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
