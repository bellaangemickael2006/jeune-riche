import { test, expect } from "@playwright/test";

// Smoke tests fonctionnant sans base de données provisionnée : ils vérifient
// la navigation et les états vides honnêtes, pas les parcours nécessitant
// des données réelles (voir tests/commerce.spec.ts pour ceux-là, à activer
// une fois Supabase provisionné — voir TODO.md).

test("la homepage affiche le hero et les CTA principaux", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Jeune Riche" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Voir le catalogue" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Le manifeste" })).toBeVisible();
});

test("la navigation principale mène aux bonnes pages", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation").getByRole("link", { name: "Catalogue" }).click();
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
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
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
