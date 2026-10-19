import { z } from "zod";

// Contenu visuel de la page d'accueil, modifiable dans Admin → Page d'accueil.
// Partagé entre l'éditeur (client), l'action d'enregistrement et les
// composants de l'accueil : sans dépendance serveur.

export const SITE_MEDIA_PREFIX = "site";

/**
 * Seules deux origines sont acceptées : les images livrées avec le site
 * (/images/…) et celles envoyées depuis l'admin dans le stockage Supabase.
 * Une URL quelconque casserait next/image et pourrait afficher n'importe quoi.
 */
export function isAllowedImageUrl(url: string) {
  if (url.startsWith("/images/") && !url.includes("..")) return true;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(base) && url.startsWith(`${base}/storage/v1/object/public/product-media/${SITE_MEDIA_PREFIX}/`);
}

const imageUrl = z.string().trim().max(500).refine(isAllowedImageUrl, "Image non autorisée.");
const percent = z.number().int().min(0).max(100);
const text = (max: number) => z.string().trim().max(max);

export const RATIOS = { square: "1 / 1", portrait: "4 / 5", landscape: "3 / 2" } as const;
export type Ratio = keyof typeof RATIOS;

const lookbookItem = z.object({
  id: z.string().min(1).max(40),
  url: imageUrl,
  alt: text(200),
  caption: text(120),
  ratio: z.enum(["square", "portrait", "landscape"]),
  focusX: percent,
  focusY: percent,
  // Lien interne facultatif (fiche produit, catalogue…), jamais un autre site.
  href: text(200).refine((v) => v === "" || (v.startsWith("/") && !v.startsWith("//")), "Lien interne attendu (ex. /catalogue)."),
});

export const homeContentSchema = z.object({
  hero: z.object({
    url: imageUrl,
    alt: text(200),
    focusX: percent,
    focusY: percent,
    overlay: z.number().int().min(0).max(90), // assombrissement derrière le texte, en %
  }),
  lookbook: z.object({
    visible: z.boolean(),
    columns: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    items: z.array(lookbookItem).max(24),
  }),
  manifeste: z.object({
    url: imageUrl.nullable(), // null = pas d'image de fond
    opacity: z.number().int().min(0).max(30),
  }),
});

export type HomeContent = z.infer<typeof homeContentSchema>;
export type LookbookItem = z.infer<typeof lookbookItem>;

/**
 * Valeurs d'origine (celles du site avant l'éditeur). Textes vides = textes
 * traduits par défaut de chaque langue ; un texte saisi dans l'admin
 * s'affiche tel quel dans toutes les langues.
 */
export const DEFAULT_HOME_CONTENT: HomeContent = {
  hero: {
    url: "/images/campagne/portant-atelier.jpg",
    alt: "",
    focusX: 50,
    focusY: 38,
    overlay: 25,
  },
  lookbook: {
    visible: true,
    columns: 2,
    items: [
      { id: "porte-dos", url: "/images/campagne/porte-dos-ciel.jpg", alt: "", caption: "", ratio: "square", focusX: 50, focusY: 50, href: "" },
      { id: "porte-face", url: "/images/campagne/porte-voiture.jpg", alt: "", caption: "", ratio: "square", focusX: 50, focusY: 50, href: "" },
    ],
  },
  manifeste: {
    url: "/images/badge/badge-black-on-white.png",
    opacity: 4,
  },
};

/** Textes traduits par défaut des deux photos d'origine du lookbook. */
export const DEFAULT_LOOKBOOK_TEXT: Record<string, { altKey: string; captionKey: string }> = {
  "porte-dos": { altKey: "home.wornAltBack", captionKey: "home.wornCaptionBack" },
  "porte-face": { altKey: "home.wornAltFront", captionKey: "home.wornCaptionFront" },
};

/** Lit un contenu enregistré ; tout fichier invalide ou ancien retombe sur les valeurs d'origine. */
export function parseHomeContent(raw: unknown): HomeContent {
  const parsed = homeContentSchema.safeParse(raw);
  return parsed.success ? parsed.data : DEFAULT_HOME_CONTENT;
}
