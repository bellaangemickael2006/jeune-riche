// Calculs du tableau de bord admin, séparés des requêtes pour être testés.

export const PERIODS = [7, 30, 90] as const;
export type Period = (typeof PERIODS)[number];

export function parsePeriod(raw: string | undefined): Period {
  const n = Number(raw);
  return (PERIODS as readonly number[]).includes(n) ? (n as Period) : 30;
}

/** Minuit UTC il y a `daysAgo` jours (Abidjan est à UTC+0, comme Vercel). */
export function startOfDayUTC(daysAgo: number, now = new Date()) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d;
}

export type DayBucket = { day: string; revenue: number; orders: number };

/** Une entrée par jour de la période, jours sans vente compris (à 0). */
export function dailySeries(orders: { createdAt: Date; total: number }[], days: number, now = new Date()): DayBucket[] {
  const buckets = new Map<string, DayBucket>();
  for (let i = days - 1; i >= 0; i--) {
    const day = startOfDayUTC(i, now).toISOString().slice(0, 10);
    buckets.set(day, { day, revenue: 0, orders: 0 });
  }
  for (const o of orders) {
    const bucket = buckets.get(o.createdAt.toISOString().slice(0, 10));
    if (!bucket) continue;
    bucket.revenue += o.total;
    bucket.orders += 1;
  }
  return [...buckets.values()];
}

export type TopPiece = { name: string; quantity: number; revenue: number };

export function topPieces(items: { productName: string; quantity: number; unitPrice: number }[], limit = 5): TopPiece[] {
  const byName = new Map<string, TopPiece>();
  for (const item of items) {
    const entry = byName.get(item.productName) ?? { name: item.productName, quantity: 0, revenue: 0 };
    entry.quantity += item.quantity;
    entry.revenue += item.quantity * item.unitPrice;
    byName.set(item.productName, entry);
  }
  return [...byName.values()].sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue).slice(0, limit);
}

export type CartFunnel = { started: number; converted: number; reminded: number; recovered: number; rate: number };

/**
 * Paniers « commencés » = email saisi au checkout (table abandoned_carts).
 * Récupéré = commande passée APRÈS la relance par email.
 */
export function cartFunnel(carts: { remindedAt: Date | null; convertedAt: Date | null }[]): CartFunnel {
  const started = carts.length;
  const converted = carts.filter((c) => c.convertedAt).length;
  const reminded = carts.filter((c) => c.remindedAt).length;
  const recovered = carts.filter((c) => c.remindedAt && c.convertedAt && c.convertedAt > c.remindedAt).length;
  return { started, converted, reminded, recovered, rate: started > 0 ? converted / started : 0 };
}

/** Évolution en % par rapport à la période précédente ; null si rien à comparer. */
export function trend(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return (current - previous) / previous;
}
