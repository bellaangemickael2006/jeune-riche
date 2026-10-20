import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanPhone } from "./phone";

test("cleanPhone accepte les formats courants", () => {
  assert.equal(cleanPhone(" +225 07 00 59 05 04 "), "+225 07 00 59 05 04");
  assert.equal(cleanPhone("0700590504"), "0700590504");
  assert.equal(cleanPhone("+33 (6) 12-34-56-78"), "+33 (6) 12-34-56-78");
});

test("cleanPhone refuse les numéros inexploitables", () => {
  assert.equal(cleanPhone(""), null);
  assert.equal(cleanPhone("1234"), null);
  assert.equal(cleanPhone("07 00 abc 05 04"), null);
  assert.equal(cleanPhone("+1234567890123456"), null);
});
