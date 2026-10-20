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

/**
 * Format international E.164 (« +2250700590504 ») exigé pour l'envoi du code
 * SMS. Sans indicatif, un numéro ivoirien à 10 chiffres (07…, 05…, 01…) reçoit
 * +225 en gardant le 0 initial, comme le veut la numérotation ivoirienne
 * depuis 2021. Renvoie null si le numéro n'est pas exploitable.
 */
export function toE164(raw: string): string | null {
  if (!cleanPhone(raw)) return null;
  const hasPlus = raw.trim().startsWith("+");
  let digits = raw.replace(/\D/g, "");
  if (!hasPlus) {
    if (digits.startsWith("00")) digits = digits.slice(2);
    else if (digits.length === 10 && digits.startsWith("0")) digits = `225${digits}`;
    else if (!digits.startsWith("225")) return null; // indicatif ambigu : on demande le « + »
  }
  if (digits.length < 8 || digits.length > 15) return null;
  return `+${digits}`;
}

/** « 2250700590504 » (format Supabase) → « +225 07 00 59 05 04 ». */
export function displayPhone(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  if (digits.startsWith("225") && digits.length === 13) {
    return `+225 ${digits.slice(3).replace(/(\d{2})(?=\d)/g, "$1 ")}`;
  }
  return `+${digits}`;
}
