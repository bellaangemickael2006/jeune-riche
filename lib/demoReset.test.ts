import { test } from "node:test";
import assert from "node:assert/strict";
import { isResetConfirmed } from "./demoReset";

test("isResetConfirmed accepte le mot quelle que soit la casse", () => {
  assert.equal(isResetConfirmed("FORMATER"), true);
  assert.equal(isResetConfirmed("formater"), true);
  assert.equal(isResetConfirmed("  Formater "), true);
});

test("isResetConfirmed refuse tout autre texte", () => {
  assert.equal(isResetConfirmed(""), false);
  assert.equal(isResetConfirmed(null), false);
  assert.equal(isResetConfirmed("formate"), false);
});
