import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Supabase's connection pooler (PgBouncer, transaction mode) ne supporte pas
// le pool interne de Prisma tel quel : sans connection_limit=1, chaque
// instance serverless (Vercel) peut ouvrir plusieurs connexions sur le
// pooler et laisser des sessions "idle in transaction" bloquées, gelant
// silencieusement les requêtes suivantes (observé le 07/09 — toutes les
// fiches produit renvoyaient "introuvable" alors que la base et les données
// étaient intactes). pgbouncer=true est déjà nécessaire pour désactiver les
// prepared statements ; connection_limit=1 force une seule connexion par
// instance de fonction, ce qui correspond au modèle d'exécution serverless
// (une requête à la fois par instance) et évite ce blocage.
function poolerSafeUrl(url: string | undefined) {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has("pgbouncer")) parsed.searchParams.set("pgbouncer", "true");
    if (!parsed.searchParams.has("connection_limit")) parsed.searchParams.set("connection_limit", "1");
    return parsed.toString();
  } catch {
    return url;
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: { url: poolerSafeUrl(process.env.DATABASE_URL) },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
