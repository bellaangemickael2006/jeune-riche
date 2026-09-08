import { test, expect } from "@playwright/test";
import { attendreHydratation, visiteurDejaVenu } from "./helpers";

test.beforeEach(async ({ page }) => {
  await visiteurDejaVenu(page);
});

// Parcours d'achat réel — c'est ce que la refonte visuelle ne doit jamais
// casser (§46, §52). Les six produits sont publiés en base avec un prix et du
// stock, donc ces tests s'appuient sur de vraies données, pas sur des mocks.

const PRODUIT = "/catalogue/t-shirt-jeune-riche";

test("la fiche produit expose couleur, tailles en boutons et une seule action principale", async ({
  page,
}) => {
  await page.goto(PRODUIT);

  await expect(page.getByRole("heading", { name: "T-shirt Jeune Riche", level: 1 })).toBeVisible();

  // Le menu déroulant de taille est interdit : les tailles sont des boutons
  // avec des états explicites.
  await expect(page.locator("select")).toHaveCount(0);
  const tailles = page.getByRole("group", { name: "Taille" }).getByRole("button");
  await expect(tailles).not.toHaveCount(0);

  // Une seule action principale.
  await expect(page.getByRole("button", { name: "Ajouter", exact: true })).toBeVisible();
});

test("sélectionner une taille change l'état sélectionné", async ({ page }) => {
  await page.goto(PRODUIT);
  const groupe = page.getByRole("group", { name: "Taille" });
  const l = groupe.getByRole("button", { name: "L", exact: true });

  await l.click();
  await expect(l).toHaveAttribute("aria-pressed", "true");
  await expect(groupe.getByRole("button", { name: "M", exact: true })).toHaveAttribute(
    "aria-pressed",
    "false"
  );
});

test("changer de couleur garde une taille valide et une action possible", async ({ page }) => {
  await page.goto(PRODUIT);
  await page.getByRole("button", { name: "Noir", exact: true }).click();
  await expect(page.getByRole("button", { name: "Ajouter", exact: true })).toBeEnabled();
});

test("la personnalisation affiche un aperçu du marquage", async ({ page }) => {
  await page.goto(PRODUIT);
  await page.getByPlaceholder("Votre nom ou pseudo").fill("BELLA");
  await expect(page.getByText("Aperçu du marquage")).toBeVisible();
  await expect(page.getByText("BELLA", { exact: true })).toBeVisible();
});

// `addLine` passe `isOpen: true` : le tiroir s'ouvre de lui-même à l'ajout.
// C'est le comportement voulu — inutile de cliquer sur « Panier » ensuite.
async function ajouterUneTailleM(page: import("@playwright/test").Page) {
  await page.goto(PRODUIT);
  await attendreHydratation(page);
  await page
    .getByRole("group", { name: "Taille" })
    .getByRole("button", { name: "M", exact: true })
    .click();
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  return page.getByRole("dialog", { name: "Panier" });
}

test("ajouter au panier ouvre le tiroir et met à jour l'en-tête", async ({ page }) => {
  const tiroir = await ajouterUneTailleM(page);

  await expect(tiroir).toBeVisible();
  await expect(tiroir.getByText("T-shirt Jeune Riche")).toBeVisible();
  await expect(tiroir.getByRole("link", { name: "Commander" })).toBeVisible();

  await tiroir.getByRole("button", { name: "Fermer le panier" }).click();
  await expect(page.getByRole("button", { name: /Panier, 1 article/ })).toBeVisible();
});

test("la quantité et la suppression fonctionnent dans le tiroir", async ({ page }) => {
  const tiroir = await ajouterUneTailleM(page);

  await tiroir.getByRole("button", { name: "Augmenter la quantité" }).click();
  await expect(page.getByRole("button", { name: /Panier, 2 articles/ })).toBeVisible();

  await tiroir.getByRole("button", { name: "Diminuer la quantité" }).click();
  await expect(page.getByRole("button", { name: /Panier, 1 article/ })).toBeVisible();

  await tiroir.getByRole("button", { name: "Retirer" }).click();
  await expect(tiroir.getByText("Votre panier est vide.")).toBeVisible();
});

test("le panier se retrouve sur la page dédiée", async ({ page }) => {
  const tiroir = await ajouterUneTailleM(page);
  await tiroir.getByRole("button", { name: "Fermer le panier" }).click();

  await page.goto("/panier");
  await expect(page.getByText("T-shirt Jeune Riche")).toBeVisible();
  await expect(page.getByRole("link", { name: "Passer commande" })).toBeVisible();
});

test("les favoris se posent depuis la fiche et se retrouvent sur /favoris", async ({ page }) => {
  await page.goto(PRODUIT);
  await attendreHydratation(page);
  await page.getByRole("button", { name: "Ajouter aux favoris" }).click();
  await expect(page.getByRole("button", { name: "Dans vos favoris" })).toBeVisible();

  await page.goto("/favoris");
  await expect(page.getByRole("article").getByText("T-shirt Jeune Riche")).toBeVisible();
});
