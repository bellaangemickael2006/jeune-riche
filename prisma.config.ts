// Configuration de la CLI Prisma (generate, migrate, studio, seed).
// Depuis Prisma 7, l'adresse de la base n'est plus dans schema.prisma : la
// CLI la lit ici, le site la lit dans lib/prisma.ts. Prisma ne charge plus
// .env tout seul, d'où dotenv (sans effet sur Vercel, où les variables sont
// déjà dans l'environnement).
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Les migrations passent par la connexion directe (port 5432) : le
    // pooler Supabase en mode transaction ne les supporte pas. Lu sans
    // env(), qui échouerait au `prisma generate` d'une installation sans
    // base configurée (CI, poste neuf) alors que generate n'en a pas besoin.
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || "",
  },
});
