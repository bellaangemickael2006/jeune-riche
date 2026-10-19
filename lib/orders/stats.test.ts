import { test } from "node:test";
import assert from "node:assert/strict";
import { cartFunnel, dailySeries, parsePeriod, topPieces, trend } from "./stats";

const now = new Date("2026-10-19T15:00:00Z");

test("parsePeriod n'accepte que 7, 30 ou 90 jours", () => {
  assert.equal(parsePeriod("7"), 7);
  assert.equal(parsePeriod("90"), 90);
  assert.equal(parsePeriod("12"), 30);
  assert.equal(parsePeriod(undefined), 30);
});

test("dailySeries remplit chaque jour, ventes comprises", () => {
  const series = dailySeries(
    [
      { createdAt: new Date("2026-10-19T09:00:00Z"), total: 10000 },
      { createdAt: new Date("2026-10-19T20:00:00Z"), total: 5000 },
      { createdAt: new Date("2026-10-17T12:00:00Z"), total: 2500 },
      { createdAt: new Date("2026-09-01T12:00:00Z"), total: 99999 }, // hors période
    ],
    7,
    now
  );
  assert.equal(series.length, 7);
  assert.equal(series[0].day, "2026-10-13");
  assert.deepEqual(series[6], { day: "2026-10-19", revenue: 15000, orders: 2 });
  assert.deepEqual(series[4], { day: "2026-10-17", revenue: 2500, orders: 1 });
  assert.equal(series[5].orders, 0);
});

test("topPieces classe par quantité puis chiffre d'affaires", () => {
  const top = topPieces([
    { productName: "T-shirt", quantity: 2, unitPrice: 15000 },
    { productName: "Casquette", quantity: 3, unitPrice: 8000 },
    { productName: "T-shirt", quantity: 1, unitPrice: 15000 },
  ]);
  assert.deepEqual(top, [
    { name: "T-shirt", quantity: 3, revenue: 45000 },
    { name: "Casquette", quantity: 3, revenue: 24000 },
  ]);
});

test("cartFunnel compte les paniers convertis et récupérés après relance", () => {
  const d = (s: string) => new Date(s);
  const funnel = cartFunnel([
    { remindedAt: null, convertedAt: null },
    { remindedAt: null, convertedAt: d("2026-10-10") },
    { remindedAt: d("2026-10-10"), convertedAt: d("2026-10-11") },
    { remindedAt: d("2026-10-12"), convertedAt: null },
  ]);
  assert.deepEqual(funnel, { started: 4, converted: 2, reminded: 2, recovered: 1, rate: 0.5 });
  assert.equal(cartFunnel([]).rate, 0);
});

test("trend renvoie null sans période de comparaison", () => {
  assert.equal(trend(150, 100), 0.5);
  assert.equal(trend(50, 0), null);
});
