import type { NextRequest } from "next/server";

// Limiteur en mémoire, pas distribué : chaque instance serverless a son
// propre compteur, remis à zéro à chaque cold start. C'est donc une
// protection best-effort contre un abus scripté depuis une seule source
// (spam, brute-force de code promo) — pas une garantie contre un abus
// distribué sur plusieurs IP. Un vrai rate-limit partagé demanderait un
// store externe (Upstash Redis ou équivalent), une décision d'infra à
// prendre séparément plutôt qu'à ajouter à l'aveugle une nuit.
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

/** true = requête autorisée, false = limite atteinte pour cette fenêtre. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
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

// `x-forwarded-for` peut contenir plusieurs IP (proxys successifs) — la
// première est celle du client d'origine côté Vercel.
export function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
