import type { NextRequest } from "next/server";
import { redisConfig, redisPipeline } from "@/lib/redis";

// Limiteur anti-abus (spam, brute-force de code promo, inscriptions en rafale).
//
// - Avec Upstash Redis configuré : compteur PARTAGÉ entre toutes les
//   instances serverless de Vercel. Un abus réparti sur plusieurs instances
//   (ou relancé après un redémarrage) est bien compté une seule fois.
// - Sans Upstash, ou si Redis ne répond pas : repli sur un compteur en
//   mémoire, propre à chaque instance (best-effort). Une panne de Redis ne
//   doit jamais bloquer une vraie commande : on laisse passer plutôt que de
//   refuser à tort.
//
// Connexion à Upstash : voir lib/redis.ts.

const buckets = new Map<string, { count: number; resetAt: number }>();

// Purge périodique pour ne pas laisser grossir indéfiniment la Map sur une
// instance qui reste chaude longtemps.
let lastSweep = Date.now();
function sweep() {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}

/** Compteur en mémoire (une instance). true = requête autorisée. */
export function memoryRateLimit(key: string, limit: number, windowMs: number): boolean {
  sweep();
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count++;
  return true;
}

/**
 * Fenêtre fixe dans Redis : INCR puis expiration posée au premier appel
 * seulement (PEXPIRE … NX). Renvoie le nombre d'appels dans la fenêtre, ou
 * null si Redis est indisponible.
 */
async function redisCount(key: string, windowMs: number): Promise<number | null> {
  if (!redisConfig()) return null;
  try {
    // Un limiteur lent ne doit pas ralentir le site : au-delà, repli mémoire.
    const replies = await redisPipeline(
      [
        ["INCR", `jr:rl:${key}`],
        ["PEXPIRE", `jr:rl:${key}`, String(windowMs), "NX"],
      ],
      1500
    );
    const [incr] = replies;
    if (typeof incr?.result !== "number") throw new Error(incr?.error ?? "réponse inattendue");
    return incr.result;
  } catch (error) {
    console.error("[rateLimit] Upstash indisponible, repli mémoire:", error);
    return null;
  }
}

/** true = requête autorisée, false = limite atteinte pour cette fenêtre. */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const count = await redisCount(key, windowMs);
  if (count === null) return memoryRateLimit(key, limit, windowMs);
  return count <= limit;
}

// `x-forwarded-for` peut contenir plusieurs IP (proxys successifs) — la
// première est celle du client d'origine côté Vercel.
export function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
