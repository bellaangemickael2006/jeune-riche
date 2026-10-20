import type { PoolConfig } from "pg";

// Réglages du pool de connexions pg utilisé par Prisma 7 (lib/prisma.ts).
//
// Supabase passe par son pooler (mode transaction) : chaque instance
// serverless (Vercel) doit rester sobre. Avant Prisma 7, ces réglages
// étaient des paramètres de l'URL (connection_limit=3, pool_timeout=15,
// pgbouncer=true) : sans limite, des sessions « idle in transaction »
// gelaient toutes les requêtes (observé le 07/09) ; avec 1 seule connexion,
// les pages qui font deux requêtes en parallèle (Promise.all) échouaient.
// 3 laisse une marge pour ce cas.
//
// Ces paramètres propres à Prisma 6 sont retirés de l'URL (pg ne les connaît
// pas), tout comme sslmode : pg traite désormais « require » comme une
// vérification complète du certificat, que celui de Supabase ne passe pas
// (erreur P1010). Le chiffrement reste actif, sans vérification du
// certificat — le comportement qu'avait Prisma 6.
const PRISMA6_PARAMS = ["pgbouncer", "connection_limit", "pool_timeout", "connect_timeout", "sslmode", "schema"];

export function poolConfig(url: string | undefined): PoolConfig {
  let connectionString = url;
  let local = false;
  if (url) {
    try {
      const parsed = new URL(url);
      PRISMA6_PARAMS.forEach((param) => parsed.searchParams.delete(param));
      connectionString = parsed.toString();
      local = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
    } catch {
      // URL illisible : transmise telle quelle, pg donnera une erreur claire.
    }
  }
  return {
    connectionString,
    max: 3,
    connectionTimeoutMillis: 15_000,
    idleTimeoutMillis: 10_000,
    ssl: local ? false : { rejectUnauthorized: false },
  };
}
