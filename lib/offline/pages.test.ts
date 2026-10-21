import { test } from "node:test";
import assert from "node:assert/strict";
import { OFFLINE_MAX_PRODUCTS, OFFLINE_STATIC_PAGES, offlinePages } from "./pages";

test("pages publiques, catégories puis fiches produit", () => {
  const pages = offlinePages({ productSlugs: ["polo-jeune-riche"], categorySlugs: ["polo"] });
  assert.deepEqual(pages.slice(0, OFFLINE_STATIC_PAGES.length), OFFLINE_STATIC_PAGES);
  assert.ok(pages.includes("/catalogue?categorie=polo"));
  assert.ok(pages.includes("/catalogue/polo-jeune-riche"));
});

test("aucune page personnelle et nombre de fiches plafonné", () => {
  const pages = offlinePages({ productSlugs: Array.from({ length: 100 }, (_, i) => `p${i}`), categorySlugs: [] });
  assert.equal(pages.filter((p) => p.startsWith("/catalogue/")).length, OFFLINE_MAX_PRODUCTS);
  assert.ok(!pages.some((p) => /^\/(compte|panier|checkout|favoris|admin|api)/.test(p)));
});

test("les identifiants sont encodés", () => {
  assert.ok(offlinePages({ productSlugs: ["a b"], categorySlugs: [] }).includes("/catalogue/a%20b"));
});
