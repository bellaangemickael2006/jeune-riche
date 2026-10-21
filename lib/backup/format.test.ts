import { test } from "node:test";
import assert from "node:assert/strict";
import { backupDay, backupKeys, fromChunks, isBackupDay, openBackup, sealBackup, toChunks } from "./format";

const SECRET = "secret-de-test-assez-long";

test("sealBackup / openBackup : aller-retour, données chiffrées et compressées", () => {
  const json = JSON.stringify({ orders: Array.from({ length: 200 }, (_, i) => ({ id: i, email: `client${i}@exemple.ci` })) });
  const sealed = sealBackup(json, SECRET);
  assert.equal(openBackup(sealed, SECRET), json);
  assert.ok(!sealed.toString("latin1").includes("client1@exemple.ci"), "aucune donnée en clair");
  assert.ok(sealed.length < json.length / 3, "compressé");
});

test("openBackup refuse une mauvaise clé ou des données altérées", () => {
  const sealed = sealBackup("{}", SECRET);
  assert.throws(() => openBackup(sealed, SECRET + "x"));
  const altered = Buffer.from(sealed);
  altered[altered.length - 1] ^= 1;
  assert.throws(() => openBackup(altered, SECRET));
  assert.throws(() => openBackup(Buffer.from([9, ...sealed.subarray(1)]), SECRET), /Format/);
});

test("toChunks / fromChunks reconstituent exactement les octets", () => {
  const sealed = sealBackup("x".repeat(50_000) + Math.random(), SECRET);
  const chunks = toChunks(sealed, 64);
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((c) => c.length <= 64));
  assert.deepEqual(fromChunks(chunks), sealed);
});

test("jour de sauvegarde et clés Redis", () => {
  assert.equal(backupDay(new Date("2026-10-21T23:59:00Z")), "2026-10-21");
  assert.equal(isBackupDay("2026-10-21"), true);
  assert.equal(isBackupDay("2026-10-21:0"), false);
  assert.equal(isBackupDay("../x"), false);
  assert.equal(backupKeys.chunk("2026-10-21", 2), "jr:backup:2026-10-21:2");
});
