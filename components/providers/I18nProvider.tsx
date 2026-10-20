"use client";

import { createContext, useContext, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { I18nextProvider } from "react-i18next";
import { initClientI18nSync, ensureLanguageLoaded, i18next } from "@/lib/i18n/client";
import { getDirection, type LanguageCode } from "@/lib/i18n/languages";
import { LANGUAGE_COOKIE, LANGUAGE_STORAGE_KEY } from "@/lib/i18n/config";

type I18nContextValue = {
  locale: LanguageCode;
  dir: "ltr" | "rtl";
  changeLanguage: (locale: LanguageCode) => Promise<void>;
  isChanging: boolean;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function useLocale() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useLocale must be used within I18nProvider");
  return ctx;
}

function persistLocale(locale: LanguageCode) {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, locale);
  } catch {
    // stockage indisponible (navigation privée, quota...) : le cookie
    // ci-dessous reste la source de vérité pour le rendu serveur
  }
  // 1 an, accessible sur tout le site — c'est le cookie que lisent
  // proxy.ts et lib/i18n/server.ts pour le rendu serveur.
  document.cookie = `${LANGUAGE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

function applyDirToDocument(locale: LanguageCode) {
  const dir = getDirection(locale);
  document.documentElement.lang = locale;
  document.documentElement.dir = dir;
}

// Initialise i18next de façon SYNCHRONE avec la ressource déjà résolue côté
// serveur (voir app/layout.tsx) — le rendu serveur des composants client et
// leur hydratation partagent donc exactement le même contenu dès le départ,
// sans flash de texte manquant ni avertissement d'hydratation.
export default function I18nProvider({
  initialLocale,
  initialResource,
  children,
}: {
  initialLocale: LanguageCode;
  initialResource: Record<string, unknown>;
  children: React.ReactNode;
}) {
  const instance = useMemo(() => initClientI18nSync(initialLocale, initialResource), [initialLocale, initialResource]);
  const [locale, setLocale] = useState<LanguageCode>(initialLocale);
  const [isChanging, setIsChanging] = useState(false);
  const router = useRouter();

  const changeLanguage = useCallback(
    async (next: LanguageCode) => {
      if (next === locale) return;
      setIsChanging(true);
      try {
        await ensureLanguageLoaded(next);
        await instance.changeLanguage(next);
        persistLocale(next);
        applyDirToDocument(next);
        setLocale(next);
        // Les Server Components (catalogue, fiche produit, checkout...) ont
        // déjà leur texte figé dans le HTML reçu — refresh() les refait
        // tourner côté serveur avec le nouveau cookie de langue, sans
        // rechargement complet de la page (pas de navigation, pas de perte
        // du panier ou du scroll). Les composants client (header, footer,
        // panier...) changent eux instantanément via changeLanguage ci-dessus.
        router.refresh();
      } finally {
        setIsChanging(false);
      }
    },
    [locale, instance, router]
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, dir: getDirection(locale), changeLanguage, isChanging }),
    [locale, changeLanguage, isChanging]
  );

  return (
    <I18nContext.Provider value={value}>
      <I18nextProvider i18n={i18next}>{children}</I18nextProvider>
    </I18nContext.Provider>
  );
}
