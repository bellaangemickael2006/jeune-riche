import type { OrderStatus, Prisma } from "@prisma/client";

// Filtres partagés entre les listes admin et leurs exports CSV : le fichier
// exporté contient exactement ce que la liste affiche.

export const ORDER_STATUSES: OrderStatus[] = ["NOUVELLE", "CONFIRMEE", "PREPARATION", "EXPEDIEE", "LIVREE", "ANNULEE"];

/** « 2026-10-01 » → début de journée UTC ; toute autre valeur est ignorée. */
function parseDay(raw: string | undefined, endOfDay = false) {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return undefined;
  const date = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return undefined;
  if (endOfDay) date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

export function ordersWhere(params: { q?: string; statut?: string; du?: string; au?: string }): Prisma.OrderWhereInput {
  const status = ORDER_STATUSES.find((s) => s === params.statut);
  const from = parseDay(params.du);
  const to = parseDay(params.au, true);
  const q = params.q?.trim();
  return {
    ...(status ? { status } : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) } } : {}),
    ...(q
      ? {
          OR: [
            { orderNumber: { contains: q, mode: "insensitive" } },
            { customerName: { contains: q, mode: "insensitive" } },
            { customerEmail: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

export function clientsWhere(params: { q?: string }): Prisma.UserWhereInput {
  const q = params.q?.trim();
  return {
    role: "CLIENT",
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { addressPhone: { contains: q } },
          ],
        }
      : {}),
  };
}
