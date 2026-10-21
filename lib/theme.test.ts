import { test } from "node:test";
import assert from "node:assert/strict";
import { THEME_CHANGE_EVENT, THEME_INIT_SCRIPT, THEME_STORAGE_KEY, resolveTheme } from "./theme";

test("sans choix mémorisé, le thème suit l'appareil", () => {
  assert.equal(resolveTheme(null, true), "light");
  assert.equal(resolveTheme(null, false), "dark");
  assert.equal(resolveTheme("n'importe quoi", true), "light");
});

test("un choix mémorisé passe avant l'appareil", () => {
  assert.equal(resolveTheme("dark", true), "dark");
  assert.equal(resolveTheme("light", false), "light");
});

// Faux navigateur minimal, puis exécution du script EXACT envoyé aux pages.
function runScript(prefersLight: boolean, stored: string | null) {
  const attrs = new Map<string, string>();
  let listener: (() => void) | null = null;
  const events: string[] = [];
  const media = { matches: prefersLight, addEventListener: (_: string, fn: () => void) => (listener = fn) };
  const document = {
    documentElement: {
      setAttribute: (k: string, v: string) => attrs.set(k, v),
      removeAttribute: (k: string) => attrs.delete(k),
    },
  };
  const window = { matchMedia: () => media, dispatchEvent: (e: Event) => events.push(e.type) };
  const localStorage = { getItem: (k: string) => (k === THEME_STORAGE_KEY ? stored : null) };
  new Function("document", "window", "localStorage", "Event", THEME_INIT_SCRIPT)(document, window, localStorage, Event);
  return {
    theme: () => (attrs.get("data-theme") === "light" ? "light" : "dark"),
    deviceChanges: (light: boolean) => {
      media.matches = light;
      listener?.();
    },
    events,
  };
}

test("le script applique le thème de l'appareil puis le suit en direct", () => {
  const page = runScript(false, null);
  assert.equal(page.theme(), "dark");
  page.deviceChanges(true);
  assert.equal(page.theme(), "light");
  page.deviceChanges(false);
  assert.equal(page.theme(), "dark");
  assert.deepEqual(page.events, [THEME_CHANGE_EVENT, THEME_CHANGE_EVENT, THEME_CHANGE_EVENT]);
});

test("le script garde un choix forcé même si l'appareil change", () => {
  const page = runScript(true, "dark");
  assert.equal(page.theme(), "dark");
  page.deviceChanges(false);
  page.deviceChanges(true);
  assert.equal(page.theme(), "dark");
});

test("l'ancienne clé « theme » est ignorée : retour au thème de l'appareil", () => {
  assert.equal(runScript(true, null).theme(), "light");
  assert.ok(!THEME_INIT_SCRIPT.includes('"theme"'));
});
