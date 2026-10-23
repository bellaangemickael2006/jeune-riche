import { test } from "node:test";
import assert from "node:assert/strict";
import { createECDH } from "node:crypto";
import { deriveVapidKeys } from "./keys";

test("paire stable pour un même secret, au bon format", () => {
  const a = deriveVapidKeys("secret-de-test")!;
  const b = deriveVapidKeys("secret-de-test")!;
  assert.deepEqual(a, b);
  assert.match(a.publicKey, /^B[A-Za-z0-9_-]{86}$/);
  assert.match(a.privateKey, /^[A-Za-z0-9_-]{43}$/);
});

test("la clé publique correspond bien à la clé privée", () => {
  const { publicKey, privateKey } = deriveVapidKeys("secret-de-test")!;
  const ecdh = createECDH("prime256v1");
  ecdh.setPrivateKey(Buffer.from(privateKey, "base64url"));
  assert.equal(ecdh.getPublicKey().toString("base64url"), publicKey);
});

test("autre secret, autre paire ; sans secret, rien", () => {
  assert.notEqual(deriveVapidKeys("a")!.publicKey, deriveVapidKeys("b")!.publicKey);
  assert.equal(deriveVapidKeys(undefined), null);
  assert.equal(deriveVapidKeys(""), null);
});
