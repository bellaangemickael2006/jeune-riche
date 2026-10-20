import { test } from "node:test";
import assert from "node:assert/strict";
import { dropPhase, isDropLocked, isDueToOpen, minutesAgo } from "./live";

const now = new Date("2026-10-20T18:00:00Z").getTime();
const drop = (status: string, startsAt: string, endsAt: string | null = null) => ({ status, startsAt, endsAt });

test("dropPhase suit les dates réelles et les statuts de fin", () => {
  assert.equal(dropPhase(drop("COMING_SOON", "2026-10-21T18:00:00Z"), now), "upcoming");
  assert.equal(dropPhase(drop("AVAILABLE", "2026-10-19T18:00:00Z"), now), "live");
  assert.equal(dropPhase(drop("AVAILABLE", "2026-10-10T18:00:00Z", "2026-10-15T18:00:00Z"), now), "ended");
  assert.equal(dropPhase(drop("SOLD_OUT", "2026-10-19T18:00:00Z"), now), "soldout");
  assert.equal(dropPhase(drop("ENDED", "2026-10-19T18:00:00Z"), now), "ended");
});

test("isDropLocked bloque l'achat avant l'ouverture, sauf précommande", () => {
  assert.equal(isDropLocked(drop("COMING_SOON", "2026-10-21T18:00:00Z"), now), true);
  assert.equal(isDropLocked(drop("PRE_ORDER", "2026-10-21T18:00:00Z"), now), false);
  assert.equal(isDropLocked(drop("AVAILABLE", "2026-10-19T18:00:00Z"), now), false);
  assert.equal(isDropLocked(null, now), false);
});

test("minutesAgo arrondit et ne passe jamais sous zéro", () => {
  assert.equal(minutesAgo("2026-10-20T17:57:40Z", now), 2);
  assert.equal(minutesAgo("2026-10-20T18:01:00Z", now), 0);
});

test("isDueToOpen : ouverture passée, statut pas encore « Disponible »", () => {
  assert.equal(isDueToOpen(drop("COMING_SOON", "2026-10-20T17:00:00Z"), now), true);
  assert.equal(isDueToOpen(drop("PRE_ORDER", "2026-10-20T17:00:00Z"), now), true);
  assert.equal(isDueToOpen(drop("AVAILABLE", "2026-10-20T17:00:00Z"), now), false);
  assert.equal(isDueToOpen(drop("COMING_SOON", "2026-10-21T17:00:00Z"), now), false);
});
