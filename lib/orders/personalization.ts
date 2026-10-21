import { sanitizePersonalization } from "@/lib/utils";

/**
 * Texte de personnalisation réellement accepté pour une ligne de commande.
 * Le navigateur l'envoie librement : sans ce contrôle, un appel direct à
 * l'API pouvait faire imprimer un texte sur une pièce non personnalisable,
 * ou un texte de n'importe quelle longueur et avec n'importe quel caractère.
 * Mêmes règles que le formulaire de la fiche produit.
 */
export function acceptedPersonalization(
  raw: string | null | undefined,
  product: { personalizationEnabled: boolean; personalizationMaxLen: number }
): string | null {
  if (!product.personalizationEnabled || !raw) return null;
  const clean = sanitizePersonalization(raw.trim(), product.personalizationMaxLen).trim();
  return clean || null;
}
