import { test } from "node:test";
import assert from "node:assert/strict";
import { contactMatches, normalizeOrderNumber, trackingStepIndex } from "./tracking";

test("normalizeOrderNumber accepte les saisies approximatives", () => {
  assert.equal(normalizeOrderNumber("jr-mfa12bc"), "JR-MFA12BC");
  assert.equal(normalizeOrderNumber(" JR MFA12BC "), "JR-MFA12BC");
  assert.equal(normalizeOrderNumber("mfa12bc"), "JR-MFA12BC");
});

test("trackingStepIndex suit reçue → préparée → expédiée → livrée", () => {
  assert.equal(trackingStepIndex("NOUVELLE"), 0);
  assert.equal(trackingStepIndex("CONFIRMEE"), 0);
  assert.equal(trackingStepIndex("PREPARATION"), 1);
  assert.equal(trackingStepIndex("EXPEDIEE"), 2);
  assert.equal(trackingStepIndex("LIVREE"), 3);
  assert.equal(trackingStepIndex("ANNULEE"), null);
});

test("contactMatches vérifie l'email sans casse", () => {
  const order = { customerEmail: "Awa@Exemple.ci", phone: null };
  assert.equal(contactMatches("awa@exemple.ci", order), true);
  assert.equal(contactMatches("autre@exemple.ci", order), false);
});

test("contactMatches compare les 8 derniers chiffres du téléphone", () => {
  const order = { customerEmail: "", phone: "+225 07 08 09 10 11" };
  assert.equal(contactMatches("0708091011", order), true);
  assert.equal(contactMatches("08 09 10 11", order), true);
  assert.equal(contactMatches("0708091012", order), false);
  assert.equal(contactMatches("1011", order), false);
  // Commande sans email : un champ vide ne doit jamais passer.
  assert.equal(contactMatches("", order), false);
  assert.equal(contactMatches("@", order), false);
});
