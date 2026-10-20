import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { poolConfig } from "@/lib/prismaPool";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma 7 : la connexion passe par le pilote PostgreSQL de Node (pg) au lieu
// du moteur Rust de Prisma. Réglages du pool (taille, délais, SSL) : voir
// lib/prismaPool.ts.
function createPrisma() {
  return new PrismaClient({
    adapter: new PrismaPg(poolConfig(process.env.DATABASE_URL)),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
