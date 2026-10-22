import { test } from "node:test";
import assert from "node:assert/strict";
import { isFinalStatus, isPushEndpoint, orderPushMessage, orderScope, userScope } from "./messages";

test("message : étape de la commande, en français ou en anglais", () => {
  assert.deepEqual(orderPushMessage({ kind: "status", status: "EXPEDIEE" }, "JR-ABC", "fr"), {
    title: "JEUNE RICHE — commande JR-ABC",
    body: "Votre commande est expédiée, elle arrive bientôt.",
  });
  assert.equal(orderPushMessage({ kind: "status", status: "LIVREE" }, "JR-ABC", "en")?.title, "JEUNE RICHE — order JR-ABC");
  // Autres langues : anglais.
  assert.equal(
    orderPushMessage({ kind: "status", status: "PREPARATION" }, "JR-ABC", "ar")?.body,
    "Your order is being prepared."
  );
});

test("message : numéro de suivi, et rien pour une commande « Nouvelle »", () => {
  assert.equal(
    orderPushMessage({ kind: "tracking", trackingNumber: "CI123" }, "JR-ABC", "fr")?.body,
    "Numéro de suivi ajouté : CI123"
  );
  assert.equal(orderPushMessage({ kind: "status", status: "NOUVELLE" }, "JR-ABC", "fr"), null);
});

test("commande terminée : livrée ou annulée", () => {
  assert.ok(isFinalStatus("LIVREE"));
  assert.ok(isFinalStatus("ANNULEE"));
  assert.ok(!isFinalStatus("EXPEDIEE"));
});

test("portées distinctes pour une commande et un compte", () => {
  assert.notEqual(orderScope("x"), userScope("x"));
});

test("adresse d'envoi : seulement les services de notification des navigateurs", () => {
  assert.ok(isPushEndpoint("https://fcm.googleapis.com/fcm/send/abc"));
  assert.ok(isPushEndpoint("https://updates.push.services.mozilla.com/wpush/v2/abc"));
  assert.ok(isPushEndpoint("https://web.push.apple.com/abc"));
  assert.ok(isPushEndpoint("https://wns2-par02p.notify.windows.com/w/?token=abc"));
  assert.ok(!isPushEndpoint("http://fcm.googleapis.com/fcm/send/abc"));
  assert.ok(!isPushEndpoint("https://fcm.googleapis.com:8443/abc"));
  assert.ok(!isPushEndpoint("https://evil.com/fcm.googleapis.com"));
  assert.ok(!isPushEndpoint("https://push.apple.com.evil.com/abc"));
  assert.ok(!isPushEndpoint("https://169.254.169.254/latest"));
  assert.ok(!isPushEndpoint("n'importe quoi"));
});
