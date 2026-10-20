import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCsp, makeNonce } from "./csp";

const csp = buildCsp("abc123", { supabaseUrl: "https://projet.supabase.co" });
const directive = (name: string) => csp.split("; ").find((d) => d.startsWith(`${name} `)) ?? "";

test("les scripts exigent le nonce, sans eval ni inline en production", () => {
  assert.match(directive("script-src"), /'nonce-abc123'/);
  assert.match(directive("script-src"), /'strict-dynamic'/);
  assert.doesNotMatch(directive("script-src"), /'unsafe-inline'|'unsafe-eval'/);
  assert.match(buildCsp("x", { dev: true }), /'unsafe-eval'/);
});

test("Supabase autorisé pour les images, l'API et le temps réel", () => {
  assert.match(directive("img-src"), /https:\/\/projet\.supabase\.co/);
  assert.match(directive("connect-src"), /https:\/\/projet\.supabase\.co/);
  assert.match(directive("connect-src"), /wss:\/\/projet\.supabase\.co/);
});

test("pas d'intégration du site dans un cadre, ni de plugin", () => {
  assert.equal(directive("frame-ancestors"), "frame-ancestors 'none'");
  assert.equal(directive("object-src"), "object-src 'none'");
  assert.match(csp, /upgrade-insecure-requests$/);
});

test("makeNonce change à chaque appel", () => {
  assert.notEqual(makeNonce(), makeNonce());
});
