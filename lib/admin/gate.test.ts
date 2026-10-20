import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { adminEntryKey, adminGateRewrites, adminLink, adminNext, gateCookieValue, safeEqual } from "./gate";

const KEY = "k".repeat(16) + "Q7x_9-Zp3mW2aB8c";
afterEach(() => {
  delete process.env.ADMIN_ENTRY_KEY;
});

test("adminEntryKey exige une clé longue et sans caractère spécial", () => {
  assert.equal(adminEntryKey(), null);
  process.env.ADMIN_ENTRY_KEY = "court";
  assert.equal(adminEntryKey(), null);
  process.env.ADMIN_ENTRY_KEY = "a".repeat(40) + "/x";
  assert.equal(adminEntryKey(), null);
  process.env.ADMIN_ENTRY_KEY = KEY;
  assert.equal(adminEntryKey(), KEY);
});

test("gateCookieValue est stable et dépend de la clé", () => {
  assert.equal(gateCookieValue(KEY), gateCookieValue(KEY));
  assert.notEqual(gateCookieValue(KEY), gateCookieValue(KEY + "x"));
  assert.ok(!gateCookieValue(KEY).includes(KEY));
  assert.match(gateCookieValue(KEY), /^[A-Za-z0-9_-]{43}$/);
});

test("adminGateRewrites : rien sans clé, /admin et ses sous-pages sinon", () => {
  assert.deepEqual(adminGateRewrites(), []);
  process.env.ADMIN_ENTRY_KEY = KEY;
  const rules = adminGateRewrites();
  assert.deepEqual(
    rules.map((r) => r.source),
    ["/admin", "/admin/:path*"]
  );
  assert.equal(rules[0].missing[0].value, "^" + gateCookieValue(KEY) + "$");
  assert.equal(rules[0].destination, "/introuvable");
});

test("safeEqual compare exactement", () => {
  assert.equal(safeEqual("abc", "abc"), true);
  assert.equal(safeEqual("abc", "abd"), false);
  assert.equal(safeEqual("abc", "ab"), false);
});

test("adminNext ne renvoie que vers l'admin", () => {
  assert.equal(adminNext("/admin/commandes/12"), "/admin/commandes/12");
  assert.equal(adminNext("/admin/activer?token_hash=x&type=invite"), "/admin/activer?token_hash=x&type=invite");
  assert.equal(adminNext("https://pirate.example"), "/admin");
  assert.equal(adminNext("//pirate.example"), "/admin");
  assert.equal(adminNext("/catalogue"), "/admin");
  assert.equal(adminNext(null), "/admin");
});

test("adminLink passe par l'entrée secrète quand elle est active", () => {
  assert.equal(adminLink("https://site.ci", "/admin/login"), "https://site.ci/admin/login");
  process.env.ADMIN_ENTRY_KEY = KEY;
  assert.equal(adminLink("https://site.ci", "/admin/login"), `https://site.ci/${KEY}?next=%2Fadmin%2Flogin`);
});
