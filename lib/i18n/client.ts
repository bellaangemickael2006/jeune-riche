"use client";

import i18next, { type i18n as I18nInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import { DEFAULT_LANGUAGE, type LanguageCode } from "./languages";
import { I18N_NAMESPACE } from "./config";

// Une seule instance i18next partagée côté client (module singleton) —
// react-i18next s'appuie dessus via I18nProvider (components/providers).
let initialized = false;
const loadedLanguages = new Set<LanguageCode>();

async function loadResource(locale: LanguageCode) {
  // Import dynamique : chaque langue devient son propre chunk JS, jamais les
  // 29 traductions embarquées dans le bundle initial pour un seul visiteur.
  const mod = await import(`../../locales/${locale}/translation.json`);
  return mod.default ?? mod;
}

// Initialisation SYNCHRONE avec la ressource déjà résolue côté serveur
// (passée en prop depuis le layout racine) : indispensable pour que le rendu
// serveur des composants client (SSR) et l'hydratation utilisent exactement
// le même contenu dès le premier rendu, sans await ni flash de texte manquant.
export function initClientI18nSync(
  initialLocale: LanguageCode,
  initialResource: Record<string, unknown>
): I18nInstance {
  if (!initialized) {
    i18next.use(initReactI18next).init({
      lng: initialLocale,
      fallbackLng: DEFAULT_LANGUAGE,
      defaultNS: I18N_NAMESPACE,
      ns: [I18N_NAMESPACE],
      resources: {
        [initialLocale]: { [I18N_NAMESPACE]: initialResource },
      },
      interpolation: { escapeValue: false }, // React échappe déjà le HTML lui-même
      returnEmptyString: false,
      react: { useSuspense: false },
    });
    loadedLanguages.add(initialLocale);
    initialized = true;
  }
  return i18next;
}

// Chargement asynchrone d'une langue supplémentaire — utilisé uniquement au
// changement de langue déclenché par l'utilisateur (jamais au premier rendu,
// donc aucun risque de désynchronisation serveur/client ici).
export async function ensureLanguageLoaded(locale: LanguageCode) {
  if (loadedLanguages.has(locale)) return;
  const resource = await loadResource(locale);
  i18next.addResourceBundle(locale, I18N_NAMESPACE, resource, true, true);
  loadedLanguages.add(locale);
}

export { i18next };
