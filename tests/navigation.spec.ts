import { test, expect } from "@playwright/test";

// Smoke tests de navigation et d'états vides honnêtes. En CI, ils tournent sur
// une base PostgreSQL jetable migrée puis remplie par le seed (catégories et
// produits en brouillon, aucun produit publié) — voir .github/workflows/ci.yml.

test("la homepage affiche le hero et les CTA principaux", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Jeune Riche" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Voir le catalogue" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Le manifeste" })).toBeVisible();
});

test("la navigation principale mène aux bonnes pages", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation").getByRole("link", { name: "Collection", exact: true }).first().click();
  await expect(page).toHaveURL(/\/catalogue$/);
  await expect(page.getByRole("heading", { name: "Toute la collection" })).toBeVisible();
});

test("le catalogue affiche les 6 catégories réelles et un état vide honnête", async ({ page }) => {
  await page.goto("/catalogue");
  for (const categorie of ["T-shirt", "Polo", "Chemise", "Débardeur", "Jogger", "Casquette"]) {
    await expect(page.getByRole("link", { name: categorie, exact: true })).toBeVisible();
  }
  // Sans produit publié en base, le catalogue ne doit jamais afficher de faux produit.
  await expect(page.getByText("Aucun produit disponible pour le moment.")).toBeVisible();
});

test("une fiche produit inexistante affiche un 404 propre", async ({ page }) => {
  const response = await page.goto("/catalogue/produit-inexistant");
  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
  // La fiche a un écran de chargement (loading.tsx) : Next.js commence à
  // envoyer la page avant de savoir que le produit n'existe pas, le code HTTP
  // reste donc 200. La page porte alors « noindex », que les moteurs de
  // recherche traitent comme une page introuvable.
  const robots = await page.locator('meta[name="robots"]').first().getAttribute("content").catch(() => null);
  expect(response?.status() === 404 || /noindex/.test(robots ?? "")).toBe(true);
});

test("le manifeste affiche le texte éditorial", async ({ page }) => {
  await page.goto("/manifeste");
  await expect(page.getByRole("heading", { name: "Manifeste" })).toBeVisible();
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

test("la newsletter est présente dans le footer", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByPlaceholder("Votre email")).toBeVisible();
});
