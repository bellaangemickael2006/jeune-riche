// Règles des drops en direct, partagées par la fiche produit, la page du
// drop et la commande (sans dépendance : testées unitairement).

type DropDates = { status: string; startsAt: Date | string; endsAt: Date | string | null };

export type DropPhase = "upcoming" | "live" | "ended" | "soldout";

export function dropPhase(drop: DropDates, now = Date.now()): DropPhase {
  if (drop.status === "SOLD_OUT") return "soldout";
  if (drop.status === "ENDED") return "ended";
  if (new Date(drop.startsAt).getTime() > now) return "upcoming";
  if (drop.endsAt && new Date(drop.endsAt).getTime() <= now) return "ended";
  return "live";
}

/**
 * Achat bloqué tant que le drop n'est pas ouvert. Exception : un drop en
 * « Précommande » se commande avant sa date, c'est tout son principe.
 */
export function isDropLocked(drop: DropDates | null | undefined, now = Date.now()): boolean {
  if (!drop || drop.status === "PRE_ORDER") return false;
  return dropPhase(drop, now) === "upcoming";
}

/** « il y a 2 min » sans librairie : uniquement pour des ventes récentes. */
export function minutesAgo(iso: string, now = Date.now()): number {
  return Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
}

/** L'heure d'ouverture est passée mais le drop n'est pas encore passé « Disponible ». */
export function isDueToOpen(drop: DropDates, now = Date.now()): boolean {
  return (drop.status === "COMING_SOON" || drop.status === "PRE_ORDER") && dropPhase(drop, now) === "live";
}
