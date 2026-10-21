// Format des sauvegardes : JSON compressé (gzip) puis chiffré (AES-256-GCM),
// découpé en morceaux pour tenir dans les requêtes Upstash. Fonctions pures,
// testées unitairement ; l'enregistrement est dans lib/backup/run.ts.
//
// Clé de chiffrement dérivée de CRON_SECRET (HKDF) : rien de plus à
// configurer. Changer CRON_SECRET rend les copies existantes illisibles —
// en refaire une juste après (bouton de la page Sauvegardes).

import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";
import { gunzipSync, gzipSync } from "node:zlib";

const VERSION = 1;
export const CHUNK_SIZE = 400_000; // caractères base64 par morceau (marge sous la limite d'Upstash)
export const KEEP_DAYS = 14;

function deriveKey(secret: string): Buffer {
  return Buffer.from(hkdfSync("sha256", secret, "jeune-riche-backup", "v1", 32));
}

/** JSON → gzip → AES-256-GCM. Sortie : version (1 octet) + iv (12) + tag (16) + données. */
export function sealBackup(json: string, secret: string): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(secret), iv);
  const body = Buffer.concat([cipher.update(gzipSync(json)), cipher.final()]);
  return Buffer.concat([Buffer.from([VERSION]), iv, cipher.getAuthTag(), body]);
}

/** Inverse de sealBackup ; lève une erreur si la clé est mauvaise ou les données altérées. */
export function openBackup(sealed: Buffer, secret: string): string {
  if (sealed[0] !== VERSION) throw new Error("Format de sauvegarde inconnu");
  const iv = sealed.subarray(1, 13);
  const tag = sealed.subarray(13, 29);
  const decipher = createDecipheriv("aes-256-gcm", deriveKey(secret), iv);
  decipher.setAuthTag(tag);
  return gunzipSync(Buffer.concat([decipher.update(sealed.subarray(29)), decipher.final()])).toString("utf8");
}

export function toChunks(sealed: Buffer, size = CHUNK_SIZE): string[] {
  const text = sealed.toString("base64");
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) chunks.push(text.slice(i, i + size));
  return chunks.length ? chunks : [""];
}

export function fromChunks(chunks: string[]): Buffer {
  return Buffer.from(chunks.join(""), "base64");
}

/** Une sauvegarde par jour (UTC) : la relancer le même jour la remplace. */
export function backupDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isBackupDay(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export const backupKeys = {
  index: "jr:backup:index",
  meta: (day: string) => `jr:backup:${day}:meta`,
  chunk: (day: string, i: number) => `jr:backup:${day}:${i}`,
};
