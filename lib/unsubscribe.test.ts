import { test, afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { makeUnsubscribeToken, readUnsubscribeToken, unsubscribeUrl } from "./unsubscribe";

beforeEach(() => {
  process.env.AUTH_SECRET = "secret-de-test-assez-long";
});
afterEach(() => {
  delete process.env.AUTH_SECRET;
});

test("le jeton redonne l'email, en minuscules", () => {
  const token = makeUnsubscribeToken("rappel", " Awa@Exemple.CI ")!;
  assert.equal(readUnsubscribeToken("rappel", token), "awa@exemple.ci");
});

test("un jeton altéré, d'un autre type ou forgé est refusé", () => {
  const token = makeUnsubscribeToken("rappel", "awa@exemple.ci")!;
  assert.equal(readUnsubscribeToken("newsletter", token), null);
  const forged = `${Buffer.from("autre@exemple.ci").toString("base64url")}.${token.split(".")[1]}`;
  assert.equal(readUnsubscribeToken("rappel", forged), null);
  assert.equal(readUnsubscribeToken("rappel", "n'importe-quoi"), null);
});

test("sans secret configuré : pas de lien plutôt qu'un lien non signé", () => {
  delete process.env.AUTH_SECRET;
  assert.equal(unsubscribeUrl("rappel", "awa@exemple.ci"), null);
});
