// Captures de contrôle aux quatre largeurs du brief, contre le site réel.
//
//   node scripts/captures.mjs [url] [dossier]
//
// Le panneau navigateur intégré à l'éditeur ne peint pas quand la fenêtre est
// masquée : toute mesure et toute capture y reviennent vides. Playwright, lui,
// pilote un vrai Chromium en arrière-plan et donne un rendu fiable.
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = process.argv[2] ?? "https://jeune-riche.vercel.app";
const OUT = process.argv[3] ?? "captures";

const LARGEURS = [
  { nom: "390", width: 390, height: 844 },
  { nom: "768", width: 768, height: 1024 },
  { nom: "1024", width: 1024, height: 768 },
  { nom: "1440", width: 1440, height: 900 },
];

const PAGES = [
  { nom: "accueil", chemin: "/" },
  { nom: "catalogue", chemin: "/catalogue" },
  { nom: "fiche-produit", chemin: "/catalogue/t-shirt-jeune-riche" },
  { nom: "manifeste", chemin: "/manifeste" },
];

const navigateur = await chromium.launch();
await mkdir(OUT, { recursive: true });

for (const largeur of LARGEURS) {
  const contexte = await navigateur.newContext({
    viewport: { width: largeur.width, height: largeur.height },
    deviceScaleFactor: 2,
  });
  // Visiteur déjà venu : l'intro ne doit pas masquer les captures.
  await contexte.addInitScript(() => {
    try {
      localStorage.setItem("jr-intro-seen-at", String(Date.now()));
    } catch {
      /* stockage indisponible */
    }
  });

  for (const p of PAGES) {
    const page = await contexte.newPage();
    await page.goto(BASE + p.chemin, { waitUntil: "networkidle", timeout: 60_000 });
    // Laisse les images se peindre avant la capture.
    await page.waitForTimeout(1200);
    const fichier = path.join(OUT, `${p.nom}-${largeur.nom}.png`);
    await page.screenshot({ path: fichier, fullPage: true });
    console.log(fichier);
    await page.close();
  }

  await contexte.close();
}

await navigateur.close();
