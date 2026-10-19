// Génération de fichiers CSV pour les exports admin (commandes, clients).
// Format choisi pour Excel en français : séparateur « ; », virgule décimale,
// BOM UTF-8 en tête pour que les accents s'affichent correctement.

export type CsvValue = string | number | Date | null | undefined;

const SEPARATOR = ";";

/**
 * Une cellule commençant par = + - @ (ou tabulation/retour) serait exécutée
 * comme une formule par Excel : un client pourrait piéger son nom
 * (« =HYPERLINK(...) »). On la préfixe d'une apostrophe, qui la force en texte.
 */
function neutralizeFormula(text: string) {
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

export function csvCell(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  let text: string;
  if (value instanceof Date) {
    text = value.toISOString().slice(0, 16).replace("T", " ");
  } else if (typeof value === "number") {
    // Montants et quantités : nombres sans formule possible, virgule décimale.
    text = String(Math.round(value * 100) / 100).replace(".", ",");
    return text;
  } else {
    text = neutralizeFormula(value);
  }
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(headers: string[], rows: CsvValue[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(csvCell).join(SEPARATOR));
  return "﻿" + lines.join("\r\n") + "\r\n";
}

/** Nom de fichier daté, ex. « commandes-2026-10-19.csv ». */
export function csvFilename(prefix: string, now = new Date()) {
  return `${prefix}-${now.toISOString().slice(0, 10)}.csv`;
}
