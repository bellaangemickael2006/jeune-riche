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
//
// RÈGLE DE PLACEMENT, lue sur les deux exemples fournis par la marque
// (LIONEL_k sur le t-shirt blanc, BELLA_K sur le taupe) : le prénom s'imprime
// sur la poitrine opposée au blason, à la MÊME hauteur que lui, en encre
// contrastée (sombre sur pièce claire, claire sur pièce sombre).
//
// Le polo, la chemise et le débardeur n'ont pas d'exemple personnalisé à
// recopier. Pour eux, tout ce qui est chiffré ci-dessous a été MESURÉ sur la
// photo elle-même, jamais estimé à l'oeil :
//   1. boîte du blason, par balayage des pixels d'encre dans la zone poitrine ;
//   2. bords du couloir libre (bord du panneau d'un côté, patte de boutonnage
//      ou blason de l'autre), par profil de luminance colonne par colonne ;
//   3. yPct = centre vertical du blason mesuré ; xPct = centre du couloir ;
//      maxWidthPct = largeur du couloir moins ~1 point d'air de chaque côté.
// Un nom de 16 caractères (le maximum autorisé) est donc garanti de tenir
// dans le couloir sans toucher ni la patte ni le blason.
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

// Ratio commun à toutes les photos produit du catalogue (1600 × 1280).
const RATIO_STUDIO = 1600 / 1280;

// Encres réelles : l'une reprend le noir du blason imprimé sur les pièces
// claires, l'autre le blanc cassé des pièces sombres.
const ENCRE_SOMBRE = "#16161c";
const ENCRE_CLAIRE = "#f6f3ee";

const TSHIRT_BLANC_FRONT: PersonalizationOverlay = {
  xPct: 33.4,
  yPct: 33.4,
  aspectRatio: RATIO_STUDIO,
  fontSizePct: 4.3,
  color: ENCRE_SOMBRE,
  maxWidthPct: 16,
};

const TSHIRT_TAUPE_FRONT: PersonalizationOverlay = {
  xPct: 40.7,
  yPct: 36.6,
  aspectRatio: RATIO_STUDIO,
  fontSizePct: 3.6,
  color: ENCRE_CLAIRE,
  maxWidthPct: 12,
};

// Polo marine — mockup face + dos. La pièce de face est celle de DROITE.
// blason mesuré : centre 77,13 % / 32,50 %, largeur 7,31 %, hauteur 8,20 %.
// Couloir libre mesuré : tissu du panneau à partir de 55,0 % (avant, c'est le
// pli d'emmanchure), patte de boutonnage de 68,0 % à 70,8 %. Couloir = 13,0 %
// de large, centre 61,5 %. Un nom de 16 caractères tient de 56,0 % à 67,0 %.
const POLO_MARINE: PersonalizationOverlay = {
  xPct: 61.5,
  yPct: 32.5,
  aspectRatio: RATIO_STUDIO,
  fontSizePct: 3.6,
  color: ENCRE_CLAIRE,
  maxWidthPct: 11,
};

// Chemise blanche — mockup face + dos. La pièce de face est celle de GAUCHE.
// blason mesuré : centre 39,22 % / 35,35 %, largeur 7,38 %, hauteur 8,28 %.
// Couloir libre mesuré : bord du panneau à 20,0 %, pli de la patte de
// boutonnage à 30,2 %. Soit 10,2 % seulement — bien plus étroit que sur un
// t-shirt, d'où un maxWidthPct réduit d'autant. Centre 25,1 % ; un nom de
// 16 caractères tient de 21,0 % à 29,3 %.
const CHEMISE_BLANCHE: PersonalizationOverlay = {
  xPct: 25.1,
  yPct: 35.35,
  aspectRatio: RATIO_STUDIO,
  fontSizePct: 3.4,
  color: ENCRE_SOMBRE,
  maxWidthPct: 8.3,
};

// Débardeur noir — mockup face + dos. La pièce de face est celle de GAUCHE.
// blason mesuré : centre 33,44 % / 32,89 %, largeur 9,81 %, hauteur 11,02 %.
// Pas de boutonnage : le couloir va du bord gauche du corps (mesuré à 9,2 %)
// au bord gauche du blason (28,56 %), soit 19,4 % de large, centre 18,9 %. Un
// nom de 16 caractères tient de 12,4 % à 25,4 %.
const DEBARDEUR_NOIR: PersonalizationOverlay = {
  xPct: 18.9,
  yPct: 32.89,
  aspectRatio: RATIO_STUDIO,
  fontSizePct: 3.4,
  color: ENCRE_CLAIRE,
  maxWidthPct: 13,
};

// Jogger gris — mockup face + dos. La paire de face est celle de GAUCHE.
// Seule pièce sans poitrine : la marque a confirmé que le prénom s'imprime
// sur la cuisse, en face du blason (qui occupe déjà l'autre jambe, mesuré
// centre 37,8 % / 34,8 %) — la symétrie des hauts, transposée aux jambes.
// Couloir mesuré sur la jambe de gauche : bord extérieur à 13,7 %, cordon de
// serrage à 24,7 % (il pend devant la cuisse ; le texte s'arrête avant plutôt
// que de le traverser). Centre 19,2 % ; un nom de 16 caractères tient de
// 14,5 % à 24,0 %. Encre du blason relevée sur la photo : #111214, soit
// l'encre sombre déjà utilisée ailleurs.
const JOGGER_GRIS: PersonalizationOverlay = {
  xPct: 19.2,
  yPct: 34.8,
  aspectRatio: RATIO_STUDIO,
  fontSizePct: 3.6,
  color: ENCRE_SOMBRE,
  maxWidthPct: 9.5,
};

export const PERSONALIZATION_OVERLAY_BY_IMAGE: Record<string, PersonalizationOverlay> = {
  // La base de données réelle (admin) référence "front-1-neutral.jpg" pour ce
  // produit — pas "front-1.jpg" comme dans prisma/seed.ts. Les deux fichiers
  // sont pixel-identiques hors fond (vérifié), donc même calibrage pour les
  // deux clés : selon l'environnement (seed local vs données admin), l'une
  // ou l'autre est utilisée.
  "/images/products/tshirt-blanc/front-1.jpg": TSHIRT_BLANC_FRONT,
  "/images/products/tshirt-blanc/front-1-neutral.jpg": TSHIRT_BLANC_FRONT,
  "/images/products/tshirt-taupe/front-1.jpg": TSHIRT_TAUPE_FRONT,

  // Même dualité "-neutral" (base admin) / original (seed) pour les mockups :
  // les deux fichiers ont été comparés et le blason y tombe au pixel près aux
  // mêmes coordonnées, donc un seul calibrage sert les deux clés.
  "/images/products/polo-marine/mockup-front-back-neutral.jpg": POLO_MARINE,
  "/images/products/polo-marine/mockup-front-back.jpg": POLO_MARINE,
  "/images/products/chemise-blanche/mockup-front-back-neutral.jpg": CHEMISE_BLANCHE,
  "/images/products/chemise-blanche/mockup-front-back.jpg": CHEMISE_BLANCHE,
  "/images/products/debardeur-noir/mockup-front-back-neutral.jpg": DEBARDEUR_NOIR,
  "/images/products/debardeur-noir/mockup-front-back.jpg": DEBARDEUR_NOIR,
  "/images/products/jogger-gris/mockup-front-back-neutral.jpg": JOGGER_GRIS,
  "/images/products/jogger-gris/mockup-front-back.jpg": JOGGER_GRIS,

  // NON CALIBRÉS, volontairement :
  // - tshirt-noir/mockup-1*.jpg et mockup-6*.jpg portent déjà un prénom
  //   imprimé dans l'image ("BAISACHTE") : y superposer un second prénom
  //   afficherait deux noms sur la même poitrine.
  // - casquette-blanche : personnalisation désactivée en base.
};
