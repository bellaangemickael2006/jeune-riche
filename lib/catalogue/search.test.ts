import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeSearch, searchProducts, searchScore } from "./search";

const p = (name: string, category: string, colors: string[] = []) => ({
  name,
  category: { name: category },
  variants: colors.map((color) => ({ color })),
});

const CATALOGUE = [
  p("T-shirt Jeune Riche", "T-shirt", ["Noir", "Blanc"]),
  p("Polo Jeune Riche", "Polo", ["Marine", "Noir"]),
  p("Débardeur Jeune Riche", "Débardeur", ["Blanc"]),
  p("Casquette Jeune Riche", "Casquette", ["Noir"]),
  p("JR Octobre Rose", "T-shirt", ["Rose"]),
];

test("normalizeSearch retire accents, casse et ponctuation", () => {
  assert.equal(normalizeSearch("  Débardeur, NOIR ! "), "debardeur noir");
  assert.equal(normalizeSearch("T-shirt"), "t shirt");
});

test("sans accent ni majuscule, on trouve quand même", () => {
  assert.deepEqual(searchProducts(CATALOGUE, "debardeur").map((x) => x.name), ["Débardeur Jeune Riche"]);
});

test("chaque mot doit correspondre (nom, catégorie ou couleur)", () => {
  assert.deepEqual(searchProducts(CATALOGUE, "polo noir").map((x) => x.name), ["Polo Jeune Riche"]);
  assert.deepEqual(searchProducts(CATALOGUE, "polo rose"), []);
});

test("le nom passe avant la catégorie, la catégorie avant la couleur", () => {
  const names = searchProducts(CATALOGUE, "t-shirt").map((x) => x.name);
  assert.deepEqual(names, ["T-shirt Jeune Riche", "JR Octobre Rose"]);
  assert.ok(searchScore(CATALOGUE[0], "noir") < searchScore(CATALOGUE[3], "casquette"));
});

test("recherche vide ou sans résultat, et limite", () => {
  assert.deepEqual(searchProducts(CATALOGUE, "   "), []);
  assert.deepEqual(searchProducts(CATALOGUE, "chaussure"), []);
  assert.equal(searchProducts(CATALOGUE, "jeune", 2).length, 2);
});
