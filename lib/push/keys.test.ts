import { test } from "node:test";
import assert from "node:assert/strict";
import { vapidPrivateKey, vapidPublicKey } from "./keys";

const PUB = "B" + "a".repeat(86);
const PRIV = "c".repeat(43);

test("clé publique : valeur propre, entourée d'espaces ou de guillemets", () => {
  assert.equal(vapidPublicKey(PUB), PUB);
  assert.equal(vapidPublicKey(`  ${PUB}  `), PUB);
  assert.equal(vapidPublicKey(`"${PUB}"`), PUB);
});

test("clé publique collée avec la ligne suivante : seule la 1re ligne compte", () => {
  assert.equal(vapidPublicKey(`${PUB}\nVAPID_PRIVATE_KEY=${PRIV}`), PUB);
});

test("clé absente, trop courte ou avec des caractères interdits : refusée", () => {
  assert.equal(vapidPublicKey(undefined), null);
  assert.equal(vapidPublicKey(""), null);
  assert.equal(vapidPublicKey(PUB.slice(1)), null);
  assert.equal(vapidPublicKey(PUB.slice(1) + "="), null);
});

test("clé privée : 43 caractères base64url", () => {
  assert.equal(vapidPrivateKey(PRIV), PRIV);
  assert.equal(vapidPrivateKey(` ${PRIV}\n`), PRIV);
  assert.equal(vapidPrivateKey(PRIV + "x"), null);
  assert.equal(vapidPrivateKey(null), null);
});
