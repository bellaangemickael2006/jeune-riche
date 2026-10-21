import { test, afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { makeSubscribeToken, readSubscribeToken } from "./confirm";

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 9, 21);

beforeEach(() => {
  process.env.CRON_SECRET = "secret-de-test";
});
afterEach(() => {
  delete process.env.CRON_SECRET;
  delete process.env.AUTH_SECRET;
});

test("jeton : aller-retour, adresse en minuscules", () => {
  const token = makeSubscribeToken(" Awa@Mail.CI ", "drop", NOW)!;
  assert.deepEqual(readSubscribeToken(token, NOW), { email: "awa@mail.ci", source: "drop" });
});

test("jeton altéré, signé avec une autre clé ou incomplet : refusé", () => {
  const token = makeSubscribeToken("awa@mail.ci", "newsletter", NOW)!;
  const [payload, signature] = token.split(".");
  const forged = Buffer.from(JSON.stringify({ e: "autre@mail.ci", s: "newsletter", d: NOW / DAY })).toString("base64url");
  assert.equal(readSubscribeToken(`${forged}.${signature}`, NOW), null);
  assert.equal(readSubscribeToken(payload, NOW), null);
  assert.equal(readSubscribeToken("", NOW), null);
  process.env.CRON_SECRET = "autre-cle";
  assert.equal(readSubscribeToken(token, NOW), null);
});

test("jeton expiré après 7 jours", () => {
  const token = makeSubscribeToken("awa@mail.ci", "newsletter", NOW)!;
  assert.ok(readSubscribeToken(token, NOW + 7 * DAY));
  assert.equal(readSubscribeToken(token, NOW + 8 * DAY), null);
});

test("sans clé configurée : pas de jeton", () => {
  delete process.env.CRON_SECRET;
  assert.equal(makeSubscribeToken("awa@mail.ci", "newsletter", NOW), null);
});
