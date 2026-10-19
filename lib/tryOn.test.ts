import { test } from "node:test";
import assert from "node:assert/strict";
import { garmentColor, garmentKindFor } from "./tryOn";

test("garmentKindFor associe les catégories de la boutique", () => {
  assert.equal(garmentKindFor("t-shirt"), "tee");
  assert.equal(garmentKindFor("debardeur"), "tank");
  assert.equal(garmentKindFor("jogger"), "pants");
  assert.equal(garmentKindFor("casquette"), "cap");
  assert.equal(garmentKindFor("accessoires"), null);
});

test("garmentColor lit les noms de variantes sans casse ni accents", () => {
  assert.equal(garmentColor("Noir"), "#141414");
  assert.equal(garmentColor("Blanche"), garmentColor("blanc"));
  assert.equal(garmentColor("Écru"), "#e9e1cf");
  assert.equal(garmentColor("Gris chiné"), "#8a8a8a");
  assert.equal(garmentColor("Fuchsia"), "#9a9a9a");
});
