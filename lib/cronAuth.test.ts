import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { isCronAuthorized } from "./cronAuth";

afterEach(() => {
  delete process.env.CRON_SECRET;
});

test("sans secret configuré : toujours refusé", () => {
  assert.equal(isCronAuthorized("Bearer "), false);
  assert.equal(isCronAuthorized("Bearer undefined"), false);
});

test("seul le bon secret passe", () => {
  process.env.CRON_SECRET = "abc123";
  assert.equal(isCronAuthorized("Bearer abc123"), true);
  assert.equal(isCronAuthorized("Bearer abc124"), false);
  assert.equal(isCronAuthorized("abc123"), false);
  assert.equal(isCronAuthorized(null), false);
});
