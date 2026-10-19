import { test } from "node:test";
import assert from "node:assert/strict";
import { canSeeLink, cleanPermissions, hasPermission } from "./permissions";

test("un propriétaire (null) a tous les droits, un employé seulement les siens", () => {
  assert.equal(hasPermission(null, "parametres"), true);
  assert.equal(hasPermission(["commandes"], "commandes"), true);
  assert.equal(hasPermission(["commandes"], "clients"), false);
  assert.equal(hasPermission([], "commandes"), false);
});

test("cleanPermissions ignore les droits inconnus et les doublons", () => {
  assert.deepEqual(cleanPermissions(["commandes", "pirate", "commandes", "avis"]), ["commandes", "avis"]);
  assert.deepEqual(cleanPermissions("commandes"), []);
});

test("le menu suit les droits ; l'équipe est réservée aux propriétaires", () => {
  assert.equal(canSeeLink(["produits"], "/admin/stock"), true);
  assert.equal(canSeeLink(["produits"], "/admin/commandes"), false);
  assert.equal(canSeeLink(["produits"], "/admin"), true);
  assert.equal(canSeeLink(["produits", "commandes"], "/admin/equipe"), false);
  assert.equal(canSeeLink(null, "/admin/equipe"), true);
});
