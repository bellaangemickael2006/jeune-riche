// Libellés et ordre d'affichage du stock — sans dépendance (client et serveur).

export const MOVEMENT_REASONS = {
  reception: "Réception de marchandise",
  inventaire: "Inventaire / correction",
  perte: "Casse, perte ou vol",
  ajustement: "Ajustement manuel",
  creation: "Création de la variante",
  commande: "Commande client",
  annulation: "Commande annulée",
  reactivation: "Commande réactivée",
} as const;

export type MovementReason = keyof typeof MOVEMENT_REASONS;

/** Motifs proposés dans l'édition en lot (les autres sont automatiques). */
export const MANUAL_REASONS: MovementReason[] = ["reception", "inventaire", "perte", "ajustement"];

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "2XL", "XXXL", "3XL", "4XL"];

/** Trie les tailles dans l'ordre du vestiaire (S, M, L…), les autres ensuite. */
export function compareSizes(a: string, b: string) {
  const ia = SIZE_ORDER.indexOf(a.toUpperCase());
  const ib = SIZE_ORDER.indexOf(b.toUpperCase());
  if (ia !== -1 && ib !== -1) return ia - ib;
  if (ia !== -1) return -1;
  if (ib !== -1) return 1;
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  return a.localeCompare(b, "fr");
}

export type StockMode = "set" | "add";

/**
 * Nouveau stock d'une variante. « set » remplace la valeur ; « add » ajoute
 * (ou retire, si négatif). Jamais sous zéro : null = refusé.
 */
export function nextStock(current: number, value: number, mode: StockMode): number | null {
  if (!Number.isInteger(value)) return null;
  const result = mode === "set" ? value : current + value;
  return result < 0 ? null : result;
}
