import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { decodeGoogleState, encodeGoogleState, googleAuthUrl, googleDirectConfig, randomToken, sha256Hex } from "./googleOAuth";

afterEach(() => {
  delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;
});

test("googleAuthUrl envoie à Google l'empreinte du nonce, jamais le nonce brut", () => {
  const url = new URL(googleAuthUrl({ clientId: "id.apps", redirectUri: "https://site.ci/auth/google", state: "etat", nonce: "brut" }));
  assert.equal(url.origin + url.pathname, "https://accounts.google.com/o/oauth2/v2/auth");
  assert.equal(url.searchParams.get("client_id"), "id.apps");
  assert.equal(url.searchParams.get("redirect_uri"), "https://site.ci/auth/google");
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.get("scope"), "openid email profile");
  assert.equal(url.searchParams.get("state"), "etat");
  assert.equal(url.searchParams.get("nonce"), createHash("sha256").update("brut").digest("hex"));
  assert.equal(url.searchParams.get("prompt"), "select_account");
});

test("état : aller-retour, et refus d'un cookie absent ou trafiqué", () => {
  const value = { state: "a", nonce: "b", next: "/compte?x=1.2" };
  assert.deepEqual(decodeGoogleState(encodeGoogleState(value)), value);
  assert.equal(decodeGoogleState(undefined), null);
  assert.equal(decodeGoogleState("pas-du-json"), null);
  assert.equal(decodeGoogleState(Buffer.from('{"state":1}').toString("base64url")), null);
});

test("randomToken et sha256Hex", () => {
  assert.notEqual(randomToken(), randomToken());
  assert.match(randomToken(), /^[A-Za-z0-9_-]{43}$/);
  assert.match(sha256Hex("x"), /^[0-9a-f]{64}$/);
});

test("googleDirectConfig exige l'identifiant ET le secret", () => {
  assert.equal(googleDirectConfig(), null);
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "id";
  assert.equal(googleDirectConfig(), null);
  process.env.GOOGLE_CLIENT_SECRET = "secret";
  assert.deepEqual(googleDirectConfig(), { clientId: "id", clientSecret: "secret" });
});
