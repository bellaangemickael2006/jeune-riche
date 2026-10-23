"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/components/providers/I18nProvider";
import { LANGUAGES, getLanguageInfo } from "@/lib/i18n/languages";
import { cn } from "@/lib/utils";

export default function LanguageSwitcher({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { locale, changeLanguage, isChanging } = useLocale();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const current = getLanguageInfo(locale);

  // Ferme au clic en dehors du composant.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Ferme à l'échappement — accessibilité clavier, même pattern que le
  // panneau de recherche du header.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Recherche vidée à la fermeture (ajusté pendant le rendu, sans effet).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) setFilter("");
  }

  const filtered = filter.trim()
    ? LANGUAGES.filter(
        (l) =>
          l.nativeName.toLowerCase().includes(filter.trim().toLowerCase()) ||
          l.englishName.toLowerCase().includes(filter.trim().toLowerCase())
      )
    : LANGUAGES;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("language.selectLanguage")}
        disabled={isChanging}
        className="flex items-center gap-1.5 text-paper/80 transition-colors hover:text-paper disabled:opacity-50"
      >
        <GlobeIcon />
        <span className="hidden text-[11px] uppercase tracking-widest2 md:inline">{current.code}</span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t("language.label")}
          className="absolute right-0 top-full z-50 mt-3 w-64 border border-line bg-ink shadow-[0_16px_40px_-16px_rgba(0,0,0,0.6)]"
        >
          <div className="border-b border-line p-3">
            <p className="mb-2 text-[10px] uppercase tracking-widest2 text-paper/40">{t("language.label")}</p>
            <input
              autoFocus
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder={t("common.search")}
              className="w-full border border-line bg-transparent px-3 py-2 text-xs text-paper placeholder:text-paper/30 focus:border-paper focus:outline-hidden"
            />
          </div>
          <ul className="max-h-72 overflow-y-auto py-1">
            {filtered.map((lang) => {
              const isActive = lang.code === locale;
              return (
                <li key={lang.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => {
                      changeLanguage(lang.code);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors",
                      isActive ? "bg-paper text-ink" : "text-paper/80 hover:bg-paper/10 hover:text-paper"
                    )}
                  >
                    <span aria-hidden className="text-base leading-none">
                      {lang.flag}
                    </span>
                    <span className="flex-1">{lang.nativeName}</span>
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-xs text-paper/40">—</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function GlobeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3" />
      <ellipse cx="9" cy="9" rx="3" ry="7" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 9h14" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
