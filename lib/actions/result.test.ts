import { test } from "node:test";
import assert from "node:assert/strict";
import { ActionError, readAmount, readInt, runAction, slugify, uniqueSlug } from "@/lib/actions/result";

function form(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

test("readInt accepte un entier positif, renvoie null si vide", () => {
  assert.equal(readInt(form({ stock: "12" }), "stock", "Stock"), 12);
  assert.equal(readInt(form({ stock: "" }), "stock", "Stock"), null);
  assert.equal(readInt(form({}), "stock", "Stock"), null);
});

test("readInt refuse les valeurs négatives, décimales ou non numériques", () => {
  for (const bad of ["-1", "2.5", "abc"]) {
    assert.throws(() => readInt(form({ stock: bad }), "stock", "Stock"), ActionError);
  }
});

test("readAmount accepte la virgule décimale et refuse le texte", () => {
  assert.equal(readAmount(form({ price: "15000" }), "price", "Prix"), 15000);
  assert.equal(readAmount(form({ price: "12,5" }), "price", "Prix"), 12.5);
  assert.equal(readAmount(form({ price: "" }), "price", "Prix"), null);
  assert.throws(() => readAmount(form({ price: "dix" }), "price", "Prix"), ActionError);
  assert.throws(() => readAmount(form({ price: "-3" }), "price", "Prix"), ActionError);
});

test("slugify retire accents et caractères spéciaux", () => {
  assert.equal(slugify("Débardeur Été 2026 !"), "debardeur-ete-2026");
});

test("uniqueSlug ajoute un suffixe tant que le slug est pris", async () => {
  const taken = new Set(["polo", "polo-2"]);
  assert.equal(await uniqueSlug("Polo", async (s) => taken.has(s)), "polo-3");
  assert.equal(await uniqueSlug("Chemise", async (s) => taken.has(s)), "chemise");
});

test("runAction renvoie le message d'une ActionError au lieu de la lever", async () => {
  assert.deepEqual(
    await runAction(async () => {
      throw new ActionError("Nom requis.");
    }),
    { ok: false, error: "Nom requis." }
  );
  assert.deepEqual(await runAction(async () => "Enregistré."), { ok: true, message: "Enregistré." });
});

test("runAction masque le détail d'une erreur inattendue", async () => {
  const original = console.error;
  console.error = () => {};
  try {
    const result = await runAction(async () => {
      throw new Error("connexion base perdue : mot de passe xyz");
    });
    assert.equal(result.ok, false);
    assert.ok(!result.ok && !result.error.includes("xyz"));
  } finally {
    console.error = original;
  }
});
