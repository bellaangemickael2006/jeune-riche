import { test } from "node:test";
import assert from "node:assert/strict";
import { acceptedPersonalization } from "./personalization";

const ENABLED = { personalizationEnabled: true, personalizationMaxLen: 10 };

test("pièce non personnalisable : le texte envoyé est ignoré", () => {
  assert.equal(acceptedPersonalization("KOFI", { personalizationEnabled: false, personalizationMaxLen: 16 }), null);
});

test("texte coupé à la longueur maximale du produit", () => {
  assert.equal(acceptedPersonalization("ABCDEFGHIJKLMNOP", ENABLED), "ABCDEFGHIJ");
});

test("caractères non imprimables ou dangereux retirés", () => {
  assert.equal(acceptedPersonalization("<b>Kofi</b>", ENABLED), "bKofib");
  assert.equal(acceptedPersonalization("  Éléa  ", ENABLED), "Éléa");
});

test("vide ou absent : pas de personnalisation", () => {
  assert.equal(acceptedPersonalization("", ENABLED), null);
  assert.equal(acceptedPersonalization(null, ENABLED), null);
  assert.equal(acceptedPersonalization("<>", ENABLED), null);
});
