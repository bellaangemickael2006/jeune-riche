import { test } from "node:test";
import assert from "node:assert/strict";
import { clientsWhere, ordersWhere } from "./filters";

test("ordersWhere ignore un statut inconnu et applique la période", () => {
  assert.deepEqual(ordersWhere({ statut: "PIRATE" }), {});
  assert.deepEqual(ordersWhere({ statut: "LIVREE" }), { status: "LIVREE" });
  assert.deepEqual(ordersWhere({ du: "2026-10-01", au: "2026-10-31" }), {
    createdAt: { gte: new Date("2026-10-01T00:00:00Z"), lt: new Date("2026-11-01T00:00:00Z") },
  });
  // Date mal formée : ignorée plutôt que de casser la requête.
  assert.deepEqual(ordersWhere({ du: "01/10/2026" }), {});
});

test("ordersWhere cherche sur la référence, le nom et l'email", () => {
  const where = ordersWhere({ q: " awa " });
  assert.equal(where.OR?.length, 3);
});

test("clientsWhere ne renvoie que des clients", () => {
  assert.deepEqual(clientsWhere({}), { role: "CLIENT" });
});
