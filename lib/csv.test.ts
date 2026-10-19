import { test } from "node:test";
import assert from "node:assert/strict";
import { csvCell, csvFilename, toCsv } from "./csv";

test("csvCell protège les séparateurs, guillemets et retours à la ligne", () => {
  assert.equal(csvCell("simple"), "simple");
  assert.equal(csvCell("Rue 1; Abidjan"), '"Rue 1; Abidjan"');
  assert.equal(csvCell('Dit "Ange"'), '"Dit ""Ange"""');
  assert.equal(csvCell("ligne1\nligne2"), '"ligne1\nligne2"');
  assert.equal(csvCell(null), "");
});

test("csvCell neutralise les formules Excel", () => {
  assert.equal(csvCell("=HYPERLINK(\"http://x\")"), "\"'=HYPERLINK(\"\"http://x\"\")\"");
  assert.equal(csvCell("+225 07"), "'+225 07");
  assert.equal(csvCell("@cmd"), "'@cmd");
});

test("csvCell écrit les nombres avec une virgule décimale", () => {
  assert.equal(csvCell(15000), "15000");
  assert.equal(csvCell(12.5), "12,5");
  assert.equal(csvCell(-3), "-3");
});

test("toCsv ajoute le BOM et sépare par des points-virgules", () => {
  const csv = toCsv(["N°", "Total"], [["JR-1", 1000]]);
  assert.ok(csv.startsWith("﻿"));
  assert.equal(csv, "﻿N°;Total\r\nJR-1;1000\r\n");
});

test("csvFilename est daté", () => {
  assert.equal(csvFilename("commandes", new Date("2026-10-19T10:00:00Z")), "commandes-2026-10-19.csv");
});
