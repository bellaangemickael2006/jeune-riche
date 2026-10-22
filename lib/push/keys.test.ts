import { test } from "node:test";
import assert from "node:assert/strict";
import { VAPID_PUBLIC_KEY, vapidPrivateKey } from "./keys";

const PRIV = "c".repeat(43);

test("clé publique écrite dans le code : format valide (87 caractères base64url)", () => {
  assert.match(VAPID_PUBLIC_KEY, /^B[A-Za-z0-9_-]{86}$/);
});

test("clé privée : 43 caractères base64url, espaces et guillemets tolérés", () => {
  assert.equal(vapidPrivateKey(PRIV), PRIV);
  assert.equal(vapidPrivateKey(` "${PRIV}" `), PRIV);
});

test("clé privée collée avec une autre ligne : seule la 1re compte", () => {
  assert.equal(vapidPrivateKey(`${PRIV}\nAUTRE=1`), PRIV);
});

test("clé privée absente ou mal formée : refusée", () => {
  assert.equal(vapidPrivateKey(undefined), null);
  assert.equal(vapidPrivateKey(""), null);
  assert.equal(vapidPrivateKey(PRIV + "x"), null);
  assert.equal(vapidPrivateKey(PRIV.slice(1) + "="), null);
});
