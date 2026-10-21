/**
 * Restaure une sauvegarde téléchargée depuis l'admin (page Sauvegardes) dans
 * une base Supabase VIDE, dont le schéma a été créé avec
 * `npm run db:deploy`. Voir README, section « Sauvegardes ».
 *
 *   npx tsx scripts/restore-backup.ts jeune-riche-sauvegarde-2026-10-21.json            (aperçu)
 *   npx tsx scripts/restore-backup.ts jeune-riche-sauvegarde-2026-10-21.json --confirmer
 *
 * Connexion : DIRECT_URL (ou DATABASE_URL) du fichier .env. Les lignes déjà
 * présentes (même identifiant) sont ignorées, jamais écrasées.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { poolConfig } from "../lib/prismaPool";

// Même ordre que BACKUP_TABLES (lib/backup/run.ts) : parents avant enfants.
const ORDER = [
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
];

async function main() {
  const [file, flag] = process.argv.slice(2);
  if (!file) throw new Error("Indiquez le fichier de sauvegarde (.json).");
  const backup = JSON.parse(readFileSync(file, "utf8")) as { version: number; createdAt: string; tables: Record<string, Record<string, unknown>[]> };
  if (backup.version !== 1 || !backup.tables) throw new Error("Fichier de sauvegarde non reconnu.");

  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("DIRECT_URL absent du fichier .env.");
  console.log(`Sauvegarde du ${backup.createdAt} → base ${new URL(url).host}`);
  for (const table of ORDER) console.log(`  ${table.padEnd(22)} ${backup.tables[table]?.length ?? "absente"}`);
  if (flag !== "--confirmer") {
    console.log("\nAperçu seulement. Relancez avec --confirmer pour écrire dans la base.");
    return;
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg(poolConfig(url)) });
  try {
    for (const table of ORDER) {
      const rows = backup.tables[table];
      if (!rows?.length) continue;
      const delegate = (prisma as unknown as Record<string, { createMany: (args: unknown) => Promise<{ count: number }> }>)[table];
      // Dates et montants sont en texte dans le fichier : Prisma les accepte tels quels.
      const { count } = await delegate.createMany({ data: rows, skipDuplicates: true });
      console.log(`  ${table.padEnd(22)} ${count} ligne(s) restaurée(s)`);
    }
  } finally {
    await prisma.$disconnect();
  }
  console.log("\nTerminé.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
