import type { Page } from "@playwright/test";

// L'intro couvre tout l'écran pendant 1,3 s à la première visite d'un
// navigateur. Chaque test Playwright part d'un contexte neuf, donc chaque test
// la déclencherait et attendrait sa sortie avant de pouvoir cliquer quoi que ce
// soit. On simule un visiteur déjà venu — l'état de très loin le plus fréquent
// — et l'intro elle-même est testée séparément, à froid.
// Tant que les stores persistés ne sont pas réhydratés, les boutons sont
// affichés (rendus côté serveur) mais leurs gestionnaires ne sont pas encore
// attachés : un clic n'a aucun effet. Attendre ce marqueur évite des échecs de
// test qui ne décrivent aucun défaut réel du site.
export async function attendreHydratation(page: Page) {
  await page.waitForFunction(
    () => document.documentElement.dataset.storesHydrated === "true",
    undefined,
    { timeout: 30_000 }
  );
}

export async function visiteurDejaVenu(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("jr-intro-seen-at", String(Date.now()));
    } catch {
      // Stockage indisponible : l'intro s'affichera, ce n'est pas bloquant.
    }
  });
}
