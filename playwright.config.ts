import { defineConfig, devices } from "@playwright/test";

// Le serveur de développement Next.js compile chaque route à la première
// visite : sur cette machine, la fiche produit demande à elle seule une
// vingtaine de secondes au premier appel. Les délais par défaut (30 s par test)
// faisaient échouer des tests parfaitement valides. On laisse de la marge au
// premier passage plutôt que de déclarer en échec ce qui n'est qu'une
// compilation lente.
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    actionTimeout: 20_000,
    navigationTimeout: 60_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
