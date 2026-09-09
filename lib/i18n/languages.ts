// Registre central des langues supportées — ajouter une langue se fait ici
// (+ son fichier /locales/{code}/translation.json), rien d'autre à toucher :
// le sélecteur, la détection et le moteur i18next lisent tous cette liste.
export type LanguageCode =
  | "fr"
  | "en"
  | "es"
  | "pt"
  | "de"
  | "it"
  | "nl"
  | "ar"
  | "zh"
  | "ja"
  | "ko"
  | "ru"
  | "tr"
  | "hi"
  | "id"
  | "vi"
  | "th"
  | "sw"
  | "uk"
  | "pl"
  | "ro"
  | "el"
  | "he"
  | "cs"
  | "sv"
  | "da"
  | "no"
  | "fi"
  | "hu";

export type LanguageInfo = {
  code: LanguageCode;
  /** Nom affiché dans la langue elle-même (ce que l'utilisateur reconnaît). */
  nativeName: string;
  /** Nom en français, utilisé uniquement pour les commentaires/logs internes. */
  englishName: string;
  flag: string;
  dir: "ltr" | "rtl";
};

// Le français est premier et sert de langue par défaut/repli — c'est la
// langue native du site (voir ART_DIRECTION.md), jamais une langue parmi
// d'autres choisie arbitrairement.
export const LANGUAGES: LanguageInfo[] = [
  { code: "fr", nativeName: "Français", englishName: "French", flag: "🇫🇷", dir: "ltr" },
  { code: "en", nativeName: "English", englishName: "English", flag: "🇬🇧", dir: "ltr" },
  { code: "es", nativeName: "Español", englishName: "Spanish", flag: "🇪🇸", dir: "ltr" },
  { code: "pt", nativeName: "Português", englishName: "Portuguese", flag: "🇵🇹", dir: "ltr" },
  { code: "de", nativeName: "Deutsch", englishName: "German", flag: "🇩🇪", dir: "ltr" },
  { code: "it", nativeName: "Italiano", englishName: "Italian", flag: "🇮🇹", dir: "ltr" },
  { code: "nl", nativeName: "Nederlands", englishName: "Dutch", flag: "🇳🇱", dir: "ltr" },
  { code: "ar", nativeName: "العربية", englishName: "Arabic", flag: "🇸🇦", dir: "rtl" },
  { code: "zh", nativeName: "中文", englishName: "Chinese", flag: "🇨🇳", dir: "ltr" },
  { code: "ja", nativeName: "日本語", englishName: "Japanese", flag: "🇯🇵", dir: "ltr" },
  { code: "ko", nativeName: "한국어", englishName: "Korean", flag: "🇰🇷", dir: "ltr" },
  { code: "ru", nativeName: "Русский", englishName: "Russian", flag: "🇷🇺", dir: "ltr" },
  { code: "tr", nativeName: "Türkçe", englishName: "Turkish", flag: "🇹🇷", dir: "ltr" },
  { code: "hi", nativeName: "हिन्दी", englishName: "Hindi", flag: "🇮🇳", dir: "ltr" },
  { code: "id", nativeName: "Bahasa Indonesia", englishName: "Indonesian", flag: "🇮🇩", dir: "ltr" },
  { code: "vi", nativeName: "Tiếng Việt", englishName: "Vietnamese", flag: "🇻🇳", dir: "ltr" },
  { code: "th", nativeName: "ไทย", englishName: "Thai", flag: "🇹🇭", dir: "ltr" },
  { code: "sw", nativeName: "Kiswahili", englishName: "Swahili", flag: "🇰🇪", dir: "ltr" },
  { code: "uk", nativeName: "Українська", englishName: "Ukrainian", flag: "🇺🇦", dir: "ltr" },
  { code: "pl", nativeName: "Polski", englishName: "Polish", flag: "🇵🇱", dir: "ltr" },
  { code: "ro", nativeName: "Română", englishName: "Romanian", flag: "🇷🇴", dir: "ltr" },
  { code: "el", nativeName: "Ελληνικά", englishName: "Greek", flag: "🇬🇷", dir: "ltr" },
  { code: "he", nativeName: "עברית", englishName: "Hebrew", flag: "🇮🇱", dir: "rtl" },
  { code: "cs", nativeName: "Čeština", englishName: "Czech", flag: "🇨🇿", dir: "ltr" },
  { code: "sv", nativeName: "Svenska", englishName: "Swedish", flag: "🇸🇪", dir: "ltr" },
  { code: "da", nativeName: "Dansk", englishName: "Danish", flag: "🇩🇰", dir: "ltr" },
  { code: "no", nativeName: "Norsk", englishName: "Norwegian", flag: "🇳🇴", dir: "ltr" },
  { code: "fi", nativeName: "Suomi", englishName: "Finnish", flag: "🇫🇮", dir: "ltr" },
  { code: "hu", nativeName: "Magyar", englishName: "Hungarian", flag: "🇭🇺", dir: "ltr" },
];

export const DEFAULT_LANGUAGE: LanguageCode = "fr";
export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code) as LanguageCode[];
export const RTL_LANGUAGES = new Set(LANGUAGES.filter((l) => l.dir === "rtl").map((l) => l.code));

export function isSupportedLanguage(code: string): code is LanguageCode {
  return (LANGUAGE_CODES as string[]).includes(code);
}

export function getLanguageInfo(code: string): LanguageInfo {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}

export function getDirection(code: string): "ltr" | "rtl" {
  return RTL_LANGUAGES.has(code as LanguageCode) ? "rtl" : "ltr";
}

// `navigator.language` / en-tête Accept-Language renvoient des variantes
// régionales (fr-CA, pt-BR, en-US...) — on ne garde que la partie langue,
// nos traductions ne distinguent pas les variantes régionales.
export function resolveLanguageTag(tag: string): LanguageCode | null {
  const base = tag.split("-")[0]?.toLowerCase();
  return isSupportedLanguage(base) ? base : null;
}

// Utilisé pour l'Accept-Language header (souvent une liste pondérée par
// qualité, ex. "fr-FR,fr;q=0.9,en;q=0.8") — renvoie la première langue
// supportée dans l'ordre de préférence du visiteur.
export function resolveAcceptLanguage(header: string | null | undefined): LanguageCode | null {
  if (!header) return null;
  const tags = header
    .split(",")
    .map((part) => part.trim().split(";")[0])
    .filter(Boolean);
  for (const tag of tags) {
    const resolved = resolveLanguageTag(tag);
    if (resolved) return resolved;
  }
  return null;
}
