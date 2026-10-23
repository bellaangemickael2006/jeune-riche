"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";

// `beforeinstallprompt` n'existe que sur Chrome/Edge/Android (pas dans
// lib.dom.d.ts, donc pas de type officiel) — "avec l'aide de Google" : c'est
// littéralement l'API d'installation native de Chrome, ce bandeau ne peut
// tout simplement pas apparaître sur Safari/Firefox, qui ne déclenchent
// jamais cet événement.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_KEY = "jr-install-prompt-dismissed";

// Bandeau d'installation PWA — apparaît dès que Chrome signale le site
// installable (beforeinstallprompt), jamais si déjà installé (mode
// standalone) ou déjà refusé une fois par ce visiteur (localStorage).
// e.preventDefault() supprime la mini-barre par défaut de Chrome pour
// afficher notre propre bandeau à la marque ; le clic "Télécharger" relance
// la VRAIE boîte de dialogue native de Chrome (deferredPrompt.prompt()) —
// on ne peut pas la recréer nous-mêmes, seulement la déclencher.
export default function InstallPrompt() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      // Stockage indisponible (navigation privée stricte...) : tant pis,
      // le bandeau pourra réapparaître, ce n'est jamais bloquant.
    }
    if (dismissed) return;

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    }
    function onInstalled() {
      setVisible(false);
      try {
        localStorage.setItem(DISMISS_KEY, "1");
      } catch {
        // best-effort
      }
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    // Accepté ou refusé dans la boîte native, peu importe : Chrome ne la
    // redonnera de toute façon pas avant un bon moment sur cet appareil, pas
    // la peine de re-proposer notre propre bandeau derrière.
    await deferredPrompt.userChoice;
    setVisible(false);
    setDeferredPrompt(null);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // best-effort
    }
  }

  function handleDismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // best-effort
    }
  }

  if (!visible || !deferredPrompt) return null;

  return (
    <div
      role="dialog"
      aria-label={t("pwa.installTitle")}
      // bottom-24 (pas bottom-5, comme le bouton WhatsApp) : reste toujours
      // au-dessus de la bulle WhatsApp flottante plutôt que de la recouvrir.
      className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-sm border border-line bg-ink p-4 shadow-xl shadow-black/40"
    >
      {/* Bouton + icône + texte sur une seule ligne débordait sur mobile
          (pas assez de largeur pour icône + 2 lignes de texte + bouton +
          croix) — le CTA passe donc sur sa propre ligne, pleine largeur,
          sous le bloc icône/texte/fermeture. */}
      <div className="flex items-start gap-3">
        <Image src="/icons/icon-192.png" alt="" width={40} height={40} className="h-10 w-10 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-paper">{t("pwa.installTitle")}</p>
          <p className="mt-0.5 text-[11px] text-paper/70">{t("pwa.installSubtitle")}</p>
        </div>
        <button
          onClick={handleDismiss}
          aria-label={t("common.close")}
          className="shrink-0 text-paper/60 transition-colors hover:text-paper"
        >
          ✕
        </button>
      </div>
      <button
        onClick={handleInstall}
        className="mt-3 w-full bg-paper py-2.5 text-[11px] uppercase tracking-widest2 text-ink transition-opacity hover:opacity-90"
      >
        {t("pwa.installCta")}
      </button>
    </div>
  );
}
