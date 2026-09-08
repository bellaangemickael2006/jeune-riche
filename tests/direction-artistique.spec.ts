import { test, expect } from "@playwright/test";
import { visiteurDejaVenu } from "./helpers";

test.beforeEach(async ({ page }) => {
  await visiteurDejaVenu(page);
});

// Garde-fou automatique de direction artistique.
//
// Le brief interdit une liste précise de procédés visuels. Ces interdits ne
// tiennent que si quelqu'un les vérifie : ce fichier les vérifie à chaque
// exécution des tests, sur les pages réelles, plutôt que de compter sur la
// discipline. Un dégradé réintroduit par mégarde fait échouer la suite.

// Toutes les pages publiques, pas seulement les cinq principales : le langage
// visuel ne tient que s'il tient partout, y compris sur les pages qu'on
// regarde rarement (404, mentions légales, confirmation de commande).
const PAGES = [
  "/",
  "/catalogue",
  "/catalogue/t-shirt-jeune-riche",
  "/panier",
  "/manifeste",
  "/favoris",
  "/drops",
  "/compte",
  "/a-propos",
  "/contact",
  "/livraison",
  "/retours",
  "/conditions",
  "/confidentialite",
  "/checkout/confirmation",
  "/page-qui-nexiste-pas",
];

const PALETTE = new Set([
  "rgb(11, 11, 12)", // ink
  "rgb(245, 244, 241)", // paper
  "rgb(19, 27, 46)", // navy
  "rgb(38, 37, 42)", // line
  "rgb(225, 222, 216)", // studio
  "rgba(0, 0, 0, 0)", // transparent
]);

for (const chemin of PAGES) {
  test(`aucun dégradé sur ${chemin}`, async ({ page }) => {
    await page.goto(chemin);
    const count = await page.evaluate(
      () =>
        [...document.querySelectorAll("*")].filter((el) => {
          const bg = getComputedStyle(el).backgroundImage;
          return bg.includes("gradient");
        }).length
    );
    expect(count).toBe(0);
  });

  test(`aucun rayon de bordure excessif sur ${chemin}`, async ({ page }) => {
    await page.goto(chemin);
    // 0 / 2 / 4 / 8px maximum. Les inputs `radio`/`checkbox` natifs et les
    // éléments du overlay de développement Next.js sont hors de notre contrôle.
    const offenders = await page.evaluate(() =>
      [...document.querySelectorAll("body *")]
        .filter((el) => !el.closest("nextjs-portal"))
        .map((el) => ({
          tag: el.tagName,
          cls: (el.className || "").toString().slice(0, 40),
          radius: getComputedStyle(el).borderTopLeftRadius,
        }))
        .filter((e) => {
          if (e.radius.endsWith("%")) return true;
          const px = parseFloat(e.radius);
          return Number.isFinite(px) && px > 8;
        })
    );
    expect(offenders).toEqual([]);
  });

  test(`aucune couleur hors palette sur ${chemin}`, async ({ page }) => {
    await page.goto(chemin);
    const offenders = await page.evaluate((palette: string[]) => {
      const autorisees = new Set(palette);
      return [...document.querySelectorAll("body *")]
        .filter((el) => !el.closest("nextjs-portal"))
        // Les nuanciers de coloris sont la seule exception assumée : ils
        // montrent la teinte réelle du tissu. C'est une information produit,
        // pas de la décoration — voir SWATCH_COLORS dans lib/utils.ts.
        .filter((el) => !el.hasAttribute("data-swatch"))
        .map((el) => ({
          tag: el.tagName,
          cls: (el.className || "").toString().slice(0, 40),
          bg: getComputedStyle(el).backgroundColor,
        }))
        .filter((e) => {
          const m = e.bg.match(/^rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)$/);
          if (!m) return true;
          const alpha = m[4] === undefined ? 1 : parseFloat(m[4]);
          // Entièrement transparent : aucun fond peint, rien à vérifier.
          if (alpha === 0) return false;
          // Un fond semi-transparent dérivé de la palette reste conforme
          // (rgba(11,11,12,0.8) pour le voile du tiroir, par exemple).
          return !autorisees.has(`rgb(${m[1]}, ${m[2]}, ${m[3]})`);
        });
    }, [...PALETTE]);
    expect(offenders).toEqual([]);
  });
}

test("le premier écran mobile ne déborde pas et garde le CTA visible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const debordement = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  );
  expect(debordement).toBe(false);

  // Le CTA et l'index de la gamme doivent tenir dans le premier écran (§39).
  const cta = page.getByRole("link", { name: "Voir la collection" }).first();
  const bas = await cta.evaluate((el) => el.getBoundingClientRect().bottom);
  expect(bas).toBeLessThan(844);
});

// L'intro doit rester conforme au §21 : très courte, une seule idée, sortie
// immédiate. Ce test part d'un navigateur qui n'a jamais vu le site.
test.describe("intro à froid", () => {
  test("l'intro s'affiche, reste courte et se ferme au premier clic", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/");

    const intro = page.getByRole("button", { name: "Passer l'introduction" });
    await expect(intro).toBeVisible();
    await expect(page.getByText("Passer")).toBeVisible();

    // N'importe où sur la surface referme : viser un lien de coin au pouce en
    // une seconde n'est pas réaliste sur un téléphone.
    await intro.click({ position: { x: 10, y: 10 } });
    await expect(intro).toBeHidden({ timeout: 3_000 });

    // Elle ne se rejoue pas dans la foulée.
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Passer l'introduction" })).toHaveCount(0);

    await context.close();
  });
});

test("sous mouvement réduit, l'intro ne s'affiche pas et tout reste lisible", async ({
  browser,
}) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Passer l'introduction" })).toHaveCount(0);
  // Aucune information ne dépend d'une animation (§40).
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("02 — La gamme")).toBeVisible();
  await expect(page.getByRole("link", { name: "Voir la collection" }).first()).toBeVisible();

  await context.close();
});

test("aucun contenu essentiel ne dépend d'une animation quand le JS est désactivé", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("02 — La gamme")).toBeVisible();
  await expect(page.getByRole("link", { name: "Voir la collection" }).first()).toBeVisible();

  await context.close();
});
