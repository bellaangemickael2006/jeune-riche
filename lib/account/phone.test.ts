import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanPhone, displayPhone, toE164 } from "./phone";

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

test("toE164 met les numéros au format international", () => {
  assert.equal(toE164("07 00 59 05 04"), "+2250700590504");
  assert.equal(toE164("+225 07 00 59 05 04"), "+2250700590504");
  assert.equal(toE164("225 0700590504"), "+2250700590504");
  assert.equal(toE164("00225 07 00 59 05 04"), "+2250700590504");
  assert.equal(toE164("+33 6 12 34 56 78"), "+33612345678");
});

test("toE164 refuse les numéros ambigus ou invalides", () => {
  assert.equal(toE164("612345678"), null);
  assert.equal(toE164("07 00 ab"), null);
  assert.equal(toE164(""), null);
});

test("displayPhone présente un numéro ivoirien lisiblement", () => {
  assert.equal(displayPhone("2250700590504"), "+225 07 00 59 05 04");
  assert.equal(displayPhone("+33612345678"), "+33612345678");
});
