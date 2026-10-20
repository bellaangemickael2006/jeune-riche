/**
 * Numéro WhatsApp saisi par le client : on garde sa présentation (espaces,
 * « + ») mais il doit contenir entre 8 et 15 chiffres (norme E.164) et rien
 * d'autre que des chiffres, espaces, points, tirets, parenthèses et « + ».
 * Renvoie null si le numéro n'est pas exploitable.
 */
export function cleanPhone(raw: string): string | null {
  const value = raw.trim().replace(/\s+/g, " ");
  if (!/^\+?[\d\s.\-()]+$/.test(value)) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  return value;
}
