import "server-only";
import { prisma } from "@/lib/prisma";
import { redisPipeline } from "@/lib/redis";
import { KEEP_DAYS, backupDay, backupKeys, fromChunks, openBackup, sealBackup, toChunks } from "@/lib/backup/format";

// Sauvegarde quotidienne de la base (cron /api/cron/backup, ou bouton de la
// page admin Sauvegardes) : copie chiffrée chez Upstash, un autre
// prestataire que Supabase, gardée 14 jours.
//
// Contenu : toutes les données de la boutique. Pas inclus : les fichiers
// (photos, vidéos, modèles 3D, déjà dans Supabase Storage) et les comptes
// de connexion Supabase (un client Google se reconnecte simplement).

/**
 * Tables sauvegardées, dans l'ordre où les restaurer (les parents avant
 * leurs enfants) : voir scripts/restore-backup.ts.
 */
export const BACKUP_TABLES = [
  "user",
  "adminPermission",
  "category",
  "drop",
  "product",
  "productImage",
  "productModel",
  "productVariant",
  "sizeGuide",
  "stockMovement",
  "order",
  "orderItem",
  "review",
  "reviewPhoto",
  "wishlistItem",
  "restockRequest",
  "promoCode",
  "abandonedCart",
  "newsletterSubscriber",
  "storeSettings",
  "adminLog",
] as const;

export type BackupTable = (typeof BACKUP_TABLES)[number];
export type BackupMeta = { day: string; createdAt: string; chunks: number; bytes: number; counts: Record<string, number>; missing: string[] };

function backupSecret() {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new Error("CRON_SECRET absent : impossible de chiffrer la sauvegarde");
  return secret;
}

async function readTable(table: BackupTable): Promise<unknown[] | null> {
  const delegate = (prisma as unknown as Record<BackupTable, { findMany: () => Promise<unknown[]> }>)[table];
  try {
    return await delegate.findMany();
  } catch (error) {
    // Table pas encore migrée (ex. journal de l'admin) : notée, sans bloquer les autres.
    console.error(`[backup] lecture ${table}:`, error);
    return null;
  }
}

export async function runBackup(now = new Date()): Promise<BackupMeta> {
  const secret = backupSecret();
  const tables: Record<string, unknown[]> = {};
  const counts: Record<string, number> = {};
  const missing: string[] = [];
  for (const table of BACKUP_TABLES) {
    const rows = await readTable(table);
    if (rows === null) {
      missing.push(table);
      continue;
    }
    tables[table] = rows;
    counts[table] = rows.length;
  }
  // Decimal (prix) et Date passent en texte : le script de restauration les relit tels quels.
  const json = JSON.stringify({ version: 1, createdAt: now.toISOString(), tables });
  const sealed = sealBackup(json, secret);
  const chunks = toChunks(sealed);
  const day = backupDay(now);
  const ttl = String((KEEP_DAYS + 1) * 86_400);

  const [previous] = await redisPipeline([["GET", backupKeys.meta(day)]], 10_000);
  const previousChunks = typeof previous?.result === "string" ? (JSON.parse(previous.result) as BackupMeta).chunks : 0;

  // Un morceau par requête : la limite de taille d'une requête Upstash
  // s'applique à la requête entière.
  for (let i = 0; i < chunks.length; i++) {
    const [reply] = await redisPipeline([["SET", backupKeys.chunk(day, i), chunks[i], "EX", ttl]], 30_000);
    if (reply?.error) throw new Error(`Upstash : ${reply.error}`);
  }

  const meta: BackupMeta = { day, createdAt: now.toISOString(), chunks: chunks.length, bytes: sealed.length, counts, missing };
  const stale = Array.from({ length: Math.max(0, previousChunks - chunks.length) }, (_, k) => backupKeys.chunk(day, chunks.length + k));
  const replies = await redisPipeline(
    [
      ["SET", backupKeys.meta(day), JSON.stringify(meta), "EX", ttl],
      ["ZADD", backupKeys.index, String(now.getTime()), day],
      // Les copies de plus de 14 jours expirent d'elles-mêmes ; on les retire aussi de la liste.
      ["ZREMRANGEBYSCORE", backupKeys.index, "-inf", String(now.getTime() - KEEP_DAYS * 86_400_000)],
      ...(stale.length ? [["DEL", ...stale]] : []),
    ],
    10_000
  );
  const failed = replies.find((r) => r.error);
  if (failed) throw new Error(`Upstash : ${failed.error}`);
  return meta;
}

/** Copies disponibles, la plus récente d'abord. */
export async function listBackups(): Promise<BackupMeta[]> {
  const [index] = await redisPipeline([["ZREVRANGE", backupKeys.index, "0", "-1"]], 10_000);
  const days = Array.isArray(index?.result) ? (index.result as string[]) : [];
  if (days.length === 0) return [];
  const [metas] = await redisPipeline([["MGET", ...days.map(backupKeys.meta)]], 10_000);
  const values = Array.isArray(metas?.result) ? (metas.result as (string | null)[]) : [];
  return values.filter((v): v is string => typeof v === "string").map((v) => JSON.parse(v) as BackupMeta);
}

/** Contenu déchiffré d'une copie (JSON), ou null si elle n'existe plus. */
export async function loadBackup(day: string): Promise<string | null> {
  const [metaReply] = await redisPipeline([["GET", backupKeys.meta(day)]], 10_000);
  if (typeof metaReply?.result !== "string") return null;
  const meta = JSON.parse(metaReply.result) as BackupMeta;
  const chunks: string[] = [];
  for (let i = 0; i < meta.chunks; i++) {
    const [reply] = await redisPipeline([["GET", backupKeys.chunk(day, i)]], 30_000);
    if (typeof reply?.result !== "string") return null;
    chunks.push(reply.result);
  }
  return openBackup(fromChunks(chunks), backupSecret());
}
