import { test } from "node:test";
import assert from "node:assert/strict";
import { subtotalOf, discountOf, totalOf } from "@/lib/orders/pricing";

test("subtotalOf additionne prix × quantité", () => {
  assert.equal(
    subtotalOf([
      { unitPrice: 10000, quantity: 2 },
      { unitPrice: 5000, quantity: 1 },
    ]),
    25000
  );
  assert.equal(subtotalOf([]), 0);
});

test("discountOf en pourcentage arrondit à l'unité la plus proche", () => {
  assert.equal(discountOf(10000, { type: "PERCENT", value: 10 }), 1000);
  assert.equal(discountOf(1001, { type: "PERCENT", value: 50 }), 501);
});

test("discountOf ne dépasse jamais 100 % ni un montant négatif", () => {
  assert.equal(discountOf(10000, { type: "PERCENT", value: 150 }), 10000);
  assert.equal(discountOf(10000, { type: "PERCENT", value: -5 }), 0);
});

test("discountOf en montant fixe est plafonné au sous-total", () => {
  assert.equal(discountOf(3000, { type: "FIXED", value: 5000 }), 3000);
  assert.equal(discountOf(10000, { type: "FIXED", value: 2000 }), 2000);
});

test("totalOf applique la remise et les frais de livraison, sans passer sous zéro", () => {
  assert.equal(totalOf(10000, 2000, 500), 8500);
  assert.equal(totalOf(10000, 0), 10000);
  assert.equal(totalOf(0, 0, 0), 0);
});
