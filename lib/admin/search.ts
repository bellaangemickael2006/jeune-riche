// Recherche rapide de l'admin : une seule case pour retrouver une commande,
// un client, un produit ou un code promo. Fonctions pures (testées) ; les
// requêtes sont dans app/admin/(protected)/recherche/page.tsx.

export const ADMIN_SEARCH_MIN = 2;
export const ADMIN_SEARCH_LIMIT = 8;

export type AdminQuery = {
  /** Texte tel que tapé (sans espaces autour), pour les recherches « contient ». */
  text: string;
  /**
   * Chiffres seuls, si la saisie ressemble à un numéro de téléphone : les
   * numéros sont enregistrés sous des formes variées (« 07 00 59 05 04 »,
   * « +2250700590504 »), on compare donc chiffres contre chiffres.
   */
  digits: string | null;
  /** Numéro de commande normalisé (« jr abc123 » → « JR-ABC123 »), si la saisie y ressemble. */
  orderNumber: string | null;
};

export function parseAdminQuery(raw: string | null | undefined): AdminQuery | null {
  const text = String(raw ?? "").trim().slice(0, 100);
  if (text.length < ADMIN_SEARCH_MIN) return null;
  const digits = text.replace(/\D/g, "");
  const looksLikePhone = /^[+\d\s().-]+$/.test(text) && digits.length >= 4;
  const compact = text.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const looksLikeOrder = /^JR[A-Z0-9]{4,}$/.test(compact);
  return {
    text,
    digits: looksLikePhone ? digits : null,
    orderNumber: looksLikeOrder ? `JR-${compact.slice(2)}` : null,
  };
}
