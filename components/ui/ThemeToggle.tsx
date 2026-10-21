"use client";

import { useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { THEME_CHANGE_EVENT, THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

// Le thème affiché est celui posé par le script de app/layout.tsx (thème de
// l'appareil, ou choix forcé) : on le lit sur la page plutôt que de le
// recalculer, et on suit ses changements (y compris quand l'appareil change
// de thème tout seul).
function subscribe(onChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onChange);
}
const currentTheme = (): Theme => (document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");
// Le rendu serveur ne connaît pas le thème : icône neutre (lune), corrigée au montage.
const serverTheme = (): Theme | null => null;

export default function ThemeToggle({ className }: { className?: string }) {
  const { t } = useTranslation();
  const theme = useSyncExternalStore<Theme | null>(subscribe, currentTheme, serverTheme);

  function toggle() {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    const deviceTheme: Theme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    try {
      // Revenir au thème de l'appareil efface le choix : le suivi automatique reprend.
      if (next === deviceTheme) localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Stockage indisponible (navigation privée…) : le thème s'applique quand même pour cette visite.
    }
    if (next === "light") document.documentElement.setAttribute("data-theme", "light");
    else document.documentElement.removeAttribute("data-theme");
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }

  return (
    <button
      onClick={toggle}
      aria-label={theme === "light" ? t("common.switchToDarkMode") : t("common.switchToLightMode")}
      className={className ?? "text-paper/80 transition-colors hover:text-paper"}
    >
      {theme === "light" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M15.5 10.5A6.5 6.5 0 0 1 7.5 2.5a6.5 6.5 0 1 0 8 8Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="9" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M9 1.5v2M9 14.5v2M16.5 9h-2M3.5 9h-2M14.31 3.69l-1.42 1.42M5.11 12.89l-1.42 1.42M14.31 14.31l-1.42-1.42M5.11 5.11 3.69 3.69"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
