import "server-only";
import { cookies, headers } from "next/headers";
import {
  DEFAULT_LANGUAGE,
  isSupportedLanguage,
  resolveAcceptLanguage,
  type LanguageCode,
} from "./languages";
import { LANGUAGE_COOKIE } from "./config";

// L'admin est un outil de gestion pour la marque elle-même (francophone),
// jamais traduit et jamais pensé pour un layout RTL — <html lang/dir> doit y
// rester fr/ltr quel que soit le cookie de langue du visiteur (ex. resté sur
// arabe après avoir testé le site public dans le même navigateur). Le chemin
// vient d'un en-tête posé par le proxy (proxy.ts), `headers()` seul ne l'expose pas.
async function isAdminPath(): Promise<boolean> {
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? "";
  return pathname.startsWith("/admin");
}

// Résout la langue effective pour la requête en cours, dans l'ordre exigé :
// 1) route admin (toujours fr, voir isAdminPath ci-dessus),
// 2) cookie déjà posé (choix explicite ou déjà détecté une fois),
// 3) en-tête Accept-Language du navigateur,
// 4) langue par défaut du site.
export async function getLocale(): Promise<LanguageCode> {
  if (await isAdminPath()) return DEFAULT_LANGUAGE;

  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LANGUAGE_COOKIE)?.value;
  if (fromCookie && isSupportedLanguage(fromCookie)) return fromCookie;

  const headerStore = await headers();
  const fromHeader = resolveAcceptLanguage(headerStore.get("accept-language"));
  return fromHeader ?? DEFAULT_LANGUAGE;
}

type TranslationTree = Record<string, unknown>;

// Un seul fichier JSON par langue (voir /locales) — le cache évite de
// re-parser le JSON à chaque composant serveur d'une même requête ; les
// Server Components peuvent tourner à la génération statique (build) donc
// ce cache vit aussi entre requêtes, sans risque puisque le contenu est
// figé au build.
const resourceCache = new Map<LanguageCode, TranslationTree>();

export async function loadResource(locale: LanguageCode): Promise<TranslationTree> {
  const cached = resourceCache.get(locale);
  if (cached) return cached;
  // Import dynamique par expression : webpack embarque chaque langue comme
  // chunk séparé plutôt que de tout regrouper dans un seul bundle serveur.
  const mod = (await import(`../../locales/${locale}/translation.json`)) as { default: TranslationTree };
  resourceCache.set(locale, mod.default);
  return mod.default;
}

function getByPath(obj: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>((acc, key) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[key] : undefined), obj);
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match
  );
}

export type ServerT = (key: string, vars?: Record<string, string | number> & { count?: number }) => string;

// Équivalent serveur de useTranslation()/t() — même moteur de clés
// imbriquées et d'interpolation {{var}} que côté client, juste résolu de
// façon synchrone-au-rendu via un import de fichier plutôt qu'un hook React
// (impossible à utiliser dans un composant serveur).
export async function getServerTranslation(locale?: LanguageCode): Promise<{ t: ServerT; locale: LanguageCode }> {
  const resolvedLocale = locale ?? (await getLocale());
  const resource = await loadResource(resolvedLocale);
  const fallback = resolvedLocale === DEFAULT_LANGUAGE ? null : await loadResource(DEFAULT_LANGUAGE);

  const t: ServerT = (key, vars) => {
    // Pluralisation façon i18next : suffixe `_other` au-delà de 1, si la clé
    // plurielle existe — sinon on retombe simplement sur la clé de base.
    if (vars && typeof vars.count === "number" && vars.count !== 1) {
      const pluralValue = getByPath(resource, `${key}_other`);
      if (typeof pluralValue === "string") return interpolate(pluralValue, vars as Record<string, string | number>);
    }
    let value = getByPath(resource, key);
    if (typeof value !== "string" && fallback) value = getByPath(fallback, key);
    if (typeof value !== "string") return key;
    return interpolate(value, vars as Record<string, string | number> | undefined);
  };

  return { t, locale: resolvedLocale };
}
