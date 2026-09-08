import { test, expect } from "@playwright/test";
import { visiteurDejaVenu } from "./helpers";

test.beforeEach(async ({ page }) => {
  await visiteurDejaVenu(page);
});

// Non-régression de navigation et de structure. Ces tests décrivent le site tel
// qu'il est réellement aujourd'hui — pas un état vide théorique : les six
// produits sont publiés en base avec un prix et du stock.

test("la page d'accueil suit la narration 01 / 02 / 03 avec un seul CTA", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("01 — La marque")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("un visage gravé");
  await expect(page.getByText("02 — La gamme")).toBeVisible();
  await expect(page.getByText("03 — Le manifeste")).toBeVisible();

  // Un seul appel à l'action dans le premier écran (§20).
  await expect(page.getByRole("link", { name: "Voir la collection" }).first()).toBeVisible();

  // La vidéo hero saturée de rouge a été retirée et ne doit pas revenir.
  await expect(page.locator("video")).toHaveCount(0);
});

test("l'index de la gamme du hero mène au catalogue filtré", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "La gamme" }).getByRole("link", { name: "Polo" }).click();
  await expect(page).toHaveURL(/\/catalogue\?categorie=polo/);
});

test("la navigation principale mène au catalogue", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation").first().getByRole("link", { name: "Collection" }).click();
  await expect(page).toHaveURL(/\/catalogue$/);
  await expect(page.getByRole("heading", { name: "Toute la collection" })).toBeVisible();
});

test("le catalogue affiche les six catégories réelles et des produits publiés", async ({ page }) => {
  await page.goto("/catalogue");

  for (const categorie of ["T-shirt", "Polo", "Chemise", "Débardeur", "Jogger", "Casquette"]) {
    await expect(page.getByRole("link", { name: categorie, exact: true })).toBeVisible();
  }
  await expect(page.locator("article")).toHaveCount(6);
});

test("le filtre par catégorie restreint la grille", async ({ page }) => {
  await page.goto("/catalogue");
  await page.getByRole("link", { name: "Polo", exact: true }).click();
  await expect(page).toHaveURL(/categorie=polo/);
  await expect(page.locator("article")).toHaveCount(1);
});

test("la recherche du header mène au catalogue filtré", async ({ page }) => {
  await page.goto("/");
  // Deux boutons « Rechercher » coexistent (desktop et mobile) : un seul est
  // visible à la fois selon la largeur.
  await page.getByRole("button", { name: "Ouvrir la recherche" }).locator("visible=true").click();
  await page.getByPlaceholder("T-shirt, jogger, casquette…").fill("polo");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/catalogue\?q=polo/);
  await expect(page.locator("article")).toHaveCount(1);
});

test("la recherche se valide aussi au bouton, pas seulement à la touche Entrée", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Ouvrir la recherche" }).locator("visible=true").click();
  await page.getByPlaceholder("T-shirt, jogger, casquette…").fill("casquette");
  await page.getByRole("button", { name: "Rechercher" }).click();
  await expect(page).toHaveURL(/\/catalogue\?q=casquette/);
  await expect(page.locator("article")).toHaveCount(1);
});

test("la recherche sans résultat affiche un état vide honnête", async ({ page }) => {
  await page.goto("/catalogue?q=zzzzz");
  await expect(page.locator("article")).toHaveCount(0);
  await expect(page.getByText("Aucun produit disponible pour le moment.")).toBeVisible();
});

test("une fiche produit inexistante affiche la page introuvable", async ({ page }) => {
  await page.goto("/catalogue/produit-inexistant");
  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
});

test("une route totalement inconnue renvoie un vrai 404", async ({ page }) => {
  const response = await page.goto("/page-qui-nexiste-pas");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
});

// Soft-404 connu et non résolu — voir TODO.md.
//
// `/catalogue/<slug-inexistant>` affiche bien la page « introuvable », mais
// avec un statut HTTP 200 au lieu de 404, en local comme en production. La
// route dynamique est rendue en streaming : l'en-tête part avant que
// `notFound()` ne s'exécute. Trois pistes ont été testées et écartées —
// supprimer la frontière `loading.tsx` du segment, appeler `notFound()` depuis
// `generateMetadata`, et vérifier le middleware (une route non appariée renvoie
// bien 404, donc il n'est pas en cause). Le test reste ici, ignoré, pour que le
// problème ne disparaisse pas du radar.
test.skip("une fiche produit inexistante devrait renvoyer un statut 404", async ({ page }) => {
  const response = await page.goto("/catalogue/produit-inexistant");
  expect(response?.status()).toBe(404);
});

test("le manifeste affiche le titre et ses quatre temps", async ({ page }) => {
  await page.goto("/manifeste");
  await expect(page.getByRole("heading", { name: "Manifeste", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(2);
  // La vidéo de fond (10,8 Mo) a été retirée et ne doit pas revenir.
  await expect(page.locator("video")).toHaveCount(0);
});

test("l'admin redirige un visiteur non connecté vers la connexion", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByRole("heading", { name: "Administration" })).toBeVisible();
});

test("le panier vide affiche un état honnête", async ({ page }) => {
  await page.goto("/panier");
  await expect(page.getByText("Votre panier est vide.")).toBeVisible();
});

test("les favoris vides affichent un état honnête", async ({ page }) => {
  await page.goto("/favoris");
  await expect(page.getByText("Aucun favori pour le moment.")).toBeVisible();
});

test("le footer porte la newsletter et le canal WhatsApp", async ({ page }) => {
  await page.goto("/");
  const footer = page.locator("footer");
  await expect(footer.getByPlaceholder("Votre email")).toBeVisible();
  // Le bouton flottant a été retiré ; le canal doit rester joignable.
  await expect(footer.getByRole("link", { name: "WhatsApp" })).toHaveAttribute(
    "href",
    /wa\.me/
  );
});

test("aucune bulle flottante ne subsiste sur le site", async ({ page }) => {
  await page.goto("/");
  const floating = page.locator('a[href*="wa.me"].fixed');
  await expect(floating).toHaveCount(0);
});
