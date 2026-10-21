import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { accountChannel, makeTrackingToken, readTrackingToken, trackingChannel } from "./liveTracking";

const NOW = Date.UTC(2026, 9, 21, 12);
const HOUR = 3_600_000;

beforeEach(() => {
  process.env.CRON_SECRET = "secret-de-test";
});
afterEach(() => {
  delete process.env.CRON_SECRET;
  delete process.env.AUTH_SECRET;
});

test("jeton : aller-retour pendant 24 h, puis expiré", () => {
  const token = makeTrackingToken("cmd_123", NOW)!;
  assert.equal(readTrackingToken(token, NOW), "cmd_123");
  assert.equal(readTrackingToken(token, NOW + 23 * HOUR), "cmd_123");
  assert.equal(readTrackingToken(token, NOW + 25 * HOUR), null);
});

test("jeton falsifié, pour une autre commande ou d'une autre clé : refusé", () => {
  const token = makeTrackingToken("cmd_123", NOW)!;
  const [, signature] = token.split(".");
  const forged = Buffer.from(`cmd_999.${NOW + HOUR}`).toString("base64url");
  assert.equal(readTrackingToken(`${forged}.${signature}`, NOW), null);
  assert.equal(readTrackingToken("n'importe quoi", NOW), null);
  assert.equal(readTrackingToken(null, NOW), null);
  process.env.CRON_SECRET = "autre";
  assert.equal(readTrackingToken(token, NOW), null);
});

test("canal : stable, propre à chaque commande, sans l'identifiant en clair", () => {
  assert.equal(trackingChannel("cmd_123"), trackingChannel("cmd_123"));
  assert.notEqual(trackingChannel("cmd_123"), trackingChannel("cmd_124"));
  assert.ok(!trackingChannel("cmd_123")!.includes("cmd_123"));
});

test("sans clé configurée : ni jeton ni canal", () => {
  delete process.env.CRON_SECRET;
  assert.equal(makeTrackingToken("cmd_123", NOW), null);
  assert.equal(trackingChannel("cmd_123"), null);
});

test("canal du compte : propre au client, distinct de celui d'une commande", () => {
  assert.equal(accountChannel("user_1"), accountChannel("user_1"));
  assert.notEqual(accountChannel("user_1"), accountChannel("user_2"));
  assert.notEqual(accountChannel("x"), trackingChannel("x"));
  assert.ok(!accountChannel("user_1")!.includes("user_1"));
});
