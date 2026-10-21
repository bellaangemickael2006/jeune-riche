import { test } from "node:test";
import assert from "node:assert/strict";
import { parseAdminQuery } from "./search";

test("trop court ou vide : pas de recherche", () => {
  assert.equal(parseAdminQuery(""), null);
  assert.equal(parseAdminQuery(" a "), null);
  assert.equal(parseAdminQuery(null), null);
});

test("un nom reste du texte, sans téléphone ni commande", () => {
  assert.deepEqual(parseAdminQuery("  Awa Koné "), { text: "Awa Koné", digits: null, orderNumber: null });
});

test("un téléphone, quelle que soit sa forme, devient des chiffres", () => {
  assert.equal(parseAdminQuery("07 00 59 05 04")?.digits, "0700590504");
  assert.equal(parseAdminQuery("+225 07-00-59")?.digits, "225070059");
  assert.equal(parseAdminQuery("0504")?.digits, "0504");
  assert.equal(parseAdminQuery("123")?.digits, null, "moins de 4 chiffres");
  assert.equal(parseAdminQuery("polo 2")?.digits, null, "texte mêlé de chiffres");
});

test("un numéro de commande est reconnu même mal tapé", () => {
  assert.equal(parseAdminQuery("jr-mabc12")?.orderNumber, "JR-MABC12");
  assert.equal(parseAdminQuery("JR MABC12")?.orderNumber, "JR-MABC12");
  assert.equal(parseAdminQuery("jogger")?.orderNumber, null);
});

test("saisie très longue coupée à 100 caractères", () => {
  assert.equal(parseAdminQuery("x".repeat(500))?.text.length, 100);
});
