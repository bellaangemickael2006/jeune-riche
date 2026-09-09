"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

// Lit l'attribut déjà posé par le script inline de app/layout.tsx (avant
// hydratation) plutôt que de recalculer depuis localStorage ici — évite
// toute divergence entre les deux et un flash au montage de ce composant.
function currentTheme(): "dark" | "light" {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

export default function ThemeToggle({ className }: { className?: string }) {
  const { t } = useTranslation();
  // Le rendu serveur ne connaît jamais le thème (choix client uniquement,
  // voir layout.tsx) — un premier rendu neutre évite un mismatch
  // d'hydratation, corrigé au montage juste après.
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    setTheme(currentTheme());
    setMounted(true);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    try {
      localStorage.setItem("theme", next);
    } catch {
      // stockage indisponible (navigation privée, quota...) : le thème
      // s'applique quand même pour cette visite, juste pas mémorisé
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={mounted && theme === "dark" ? t("common.switchToLightMode") : t("common.switchToDarkMode")}
      className={className ?? "text-paper/80 transition-colors hover:text-paper"}
    >
      {mounted && theme === "light" ? <SunIcon /> : <MoonIcon />}
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
