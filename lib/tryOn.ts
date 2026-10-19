// Essayage 3D : quelle pièce le mannequin porte, et dans quelle couleur.
// Sans dépendance (partagé entre la fiche produit et ses tests).

export type GarmentKind = "tee" | "tank" | "pants" | "cap";

const KIND_BY_CATEGORY: Record<string, GarmentKind> = {
  "t-shirt": "tee",
  polo: "tee",
  chemise: "tee",
  sweat: "tee",
  hoodie: "tee",
  debardeur: "tank",
  jogger: "pants",
  pantalon: "pants",
  short: "pants",
  casquette: "cap",
};

/** null : catégorie sans essayage 3D (la galerie photo reste seule). */
export function garmentKindFor(categorySlug: string): GarmentKind | null {
  return KIND_BY_CATEGORY[categorySlug] ?? null;
}

// Noms de couleurs tels que saisis dans l'admin (variantes), sans accents ni casse.
const COLOR_BY_NAME: Record<string, string> = {
  noir: "#141414",
  black: "#141414",
  blanc: "#f1efea",
  blanche: "#f1efea",
  white: "#f1efea",
  ecru: "#e9e1cf",
  creme: "#ece4d2",
  beige: "#d8c8a8",
  sable: "#cdb891",
  taupe: "#8b7d6b",
  marron: "#5b4030",
  chocolat: "#4a3326",
  marine: "#1f2a44",
  navy: "#1f2a44",
  bleu: "#2c4f8a",
  ciel: "#8fb4d9",
  gris: "#8a8a8a",
  anthracite: "#3a3a3c",
  vert: "#2f5a3a",
  kaki: "#6b6a43",
  olive: "#5d6233",
  rouge: "#a3262a",
  bordeaux: "#5e1a24",
  rose: "#e3a6b4",
  jaune: "#e7c547",
  orange: "#d9772b",
  violet: "#5b3d7a",
};

function normalize(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

/** Couleur CSS d'une variante ; inconnue → gris neutre plutôt qu'une couleur inventée. */
export function garmentColor(name: string): string {
  const key = normalize(name);
  if (COLOR_BY_NAME[key]) return COLOR_BY_NAME[key];
  // « Bleu nuit », « Gris chiné »… : le premier mot connu l'emporte.
  for (const word of key.split(/[\s-]+/)) {
    if (COLOR_BY_NAME[word]) return COLOR_BY_NAME[word];
  }
  return "#9a9a9a";
}
