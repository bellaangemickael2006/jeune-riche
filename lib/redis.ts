// Accès REST à Upstash Redis, partagé par le limiteur anti-abus
// (lib/rateLimit.ts) et les sauvegardes (lib/backup).
//
// Variables reconnues : UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN,
// ou KV_REST_API_URL / KV_REST_API_TOKEN (noms posés automatiquement par
// l'intégration Upstash du Marketplace Vercel).

export function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

export type RedisReply = { result?: unknown; error?: string };

/** Envoie plusieurs commandes en un aller-retour. Lève une erreur si Redis est absent ou répond mal. */
export async function redisPipeline(commands: string[][], timeoutMs: number): Promise<RedisReply[]> {
  const config = redisConfig();
  if (!config) throw new Error("Upstash Redis non configuré");
  const res = await fetch(`${config.url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash HTTP ${res.status}`);
  return (await res.json()) as RedisReply[];
}
