import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { adminMfaStage, isAdminMfaDisabled } from "./mfa";

afterEach(() => {
  delete process.env.ADMIN_MFA;
});

test("code déjà saisi pendant la session : accès", () => {
  assert.equal(adminMfaStage("aal2", 1), "ok");
});

test("mot de passe seul avec un téléphone enregistré : code à saisir", () => {
  assert.equal(adminMfaStage("aal1", 1), "verify");
  assert.equal(adminMfaStage("aal1", 2), "verify");
});

test("mot de passe seul sans téléphone enregistré : enregistrement obligatoire", () => {
  assert.equal(adminMfaStage("aal1", 0), "enroll");
  assert.equal(adminMfaStage(null, 0), "enroll");
});

test("l'interrupteur de secours n'accepte que « off »", () => {
  assert.equal(isAdminMfaDisabled(), false);
  process.env.ADMIN_MFA = "on";
  assert.equal(isAdminMfaDisabled(), false);
  process.env.ADMIN_MFA = " OFF ";
  assert.equal(isAdminMfaDisabled(), true);
});
