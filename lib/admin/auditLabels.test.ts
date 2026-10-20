import { test } from "node:test";
import assert from "node:assert/strict";
import { AUDIT_ACTIONS, AUDIT_SECTIONS, auditLabel, auditSection, isSensitiveAction, parseJournalFilters } from "./auditLabels";

test("chaque action appartient à une section connue", () => {
  for (const action of Object.keys(AUDIT_ACTIONS)) {
    assert.ok(auditSection(action), action);
    assert.ok(auditSection(action)! in AUDIT_SECTIONS);
  }
  assert.equal(auditSection("pirate.x"), null);
});

test("auditLabel retombe sur l'action brute si inconnue", () => {
  assert.equal(auditLabel("produits.creation"), "Produit créé");
  assert.equal(auditLabel("ancienne.action"), "ancienne.action");
});

test("isSensitiveAction repère suppressions, équipe, formatage et connexions refusées", () => {
  assert.equal(isSensitiveAction("produits.suppression"), true);
  assert.equal(isSensitiveAction("equipe.ajout"), true);
  assert.equal(isSensitiveAction("parametres.formatage"), true);
  assert.equal(isSensitiveAction("connexion.refusee"), true);
  assert.equal(isSensitiveAction("connexion.reussie"), false);
  assert.equal(isSensitiveAction("commandes.statut"), false);
});

test("parseJournalFilters ignore les valeurs inconnues et borne la page", () => {
  assert.deepEqual(parseJournalFilters({}), { section: null, qui: null, page: 1 });
  assert.deepEqual(parseJournalFilters({ section: "stock", qui: " A@B.CI ", page: "3" }), { section: "stock", qui: "a@b.ci", page: 3 });
  assert.equal(parseJournalFilters({ section: "'; drop table" }).section, null);
  assert.equal(parseJournalFilters({ page: "-4" }).page, 1);
  assert.equal(parseJournalFilters({ page: "abc" }).page, 1);
  assert.equal(parseJournalFilters({ page: "99999" }).page, 1000);
});
