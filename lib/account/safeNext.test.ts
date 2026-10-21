import { test } from "node:test";
import assert from "node:assert/strict";
import { safeNext } from "./safeNext";

test("safeNext garde les chemins internes", () => {
  assert.equal(safeNext("/compte"), "/compte");
  assert.equal(safeNext("/catalogue/t-shirt?couleur=noir"), "/catalogue/t-shirt?couleur=noir");
});

test("safeNext refuse toute sortie vers un autre site", () => {
  assert.equal(safeNext(null), "/?login=1");
  assert.equal(safeNext("https://pirate.example"), "/?login=1");
  assert.equal(safeNext("//pirate.example"), "/?login=1");
  assert.equal(safeNext("/\\pirate.example"), "/?login=1");
});

test("safeNext refuse les tabulations et retours à la ligne cachés", () => {
  // Le navigateur les supprime : « /\t/pirate » devient « //pirate ».
  assert.equal(safeNext("/\t/pirate.example"), "/?login=1");
  assert.equal(safeNext("/\n/pirate.example"), "/?login=1");
  assert.equal(safeNext("/\r\n/pirate.example"), "/?login=1");
  // Encodé, il reste un simple segment de chemin sur le site.
  assert.equal(safeNext("/%09/pirate.example"), "/%09/pirate.example");
});
