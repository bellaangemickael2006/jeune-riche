import { test } from "node:test";
import assert from "node:assert/strict";
import { compareSizes, nextStock } from "./labels";

test("compareSizes range les tailles dans l'ordre du vestiaire", () => {
  assert.deepEqual(["XL", "S", "Taille unique", "M", "L"].sort(compareSizes), ["S", "M", "L", "XL", "Taille unique"]);
  assert.deepEqual(["42", "38", "40"].sort(compareSizes), ["38", "40", "42"]);
});

test("nextStock remplace ou ajoute, jamais sous zéro", () => {
  assert.equal(nextStock(5, 12, "set"), 12);
  assert.equal(nextStock(5, 3, "add"), 8);
  assert.equal(nextStock(5, -5, "add"), 0);
  assert.equal(nextStock(5, -6, "add"), null);
  assert.equal(nextStock(5, -1, "set"), null);
  assert.equal(nextStock(5, 1.5, "set"), null);
});
