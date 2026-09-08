// Coordonnées calibrées à la main sur les vraies photos produit — mesurées en
// comparant pixel à pixel chaque photo à son exemple personnalisé
// (public/images/products/.../front-personalized-example.jpg), pas devinées.
// xPct/yPct : centre du texte, en % de l'image. fontSizePct : taille de police
// en % de la hauteur de l'image (unité CSS `cqh`). aspectRatio : ratio réel du
// fichier image (largeur/hauteur), nécessaire pour recréer exactement la boîte
// `object-contain` sans dépendre du DOM au runtime.
//
// Seules les images ci-dessous ont été calibrées. Les autres photos du produit
// (mockups, détails, lifestyle, dos) n'ont pas d'équivalent "avec broderie" à
// mesurer : on n'y affiche donc pas la superposition plutôt que d'inventer une
// position.
export type PersonalizationOverlay = {
  xPct: number;
  yPct: number;
  aspectRatio: number;
  fontSizePct: number;
  color: string;
  /** Largeur max autorisée pour le texte rendu (% de la largeur de l'image),
   * centrée sur xPct — au-delà, le texte est réduit pour ne jamais chevaucher
   * le logo existant sur le vêtement. */
  maxWidthPct: number;
};

export const PERSONALIZATION_OVERLAY_BY_IMAGE: Record<string, PersonalizationOverlay> = {
  "/images/products/tshirt-blanc/front-1.jpg": {
    xPct: 33.4,
    yPct: 33.4,
    aspectRatio: 1600 / 1280,
    fontSizePct: 4.3,
    color: "#16161c",
    maxWidthPct: 16,
  },
  "/images/products/tshirt-taupe/front-1.jpg": {
    xPct: 40.7,
    yPct: 36.6,
    aspectRatio: 1600 / 1280,
    fontSizePct: 3.6,
    color: "#f6f3ee",
    maxWidthPct: 12,
  },
};
