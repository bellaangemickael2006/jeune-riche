import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

const SETTINGS_ID = "default";

// Singleton : une seule ligne, créée à la volée si elle n'existe pas encore
// (le projet est parti sans réglages configurés, valeurs par défaut à 0).
export const getStoreSettings = unstable_cache(
  async () => {
    try {
      const existing = await prisma.storeSettings.findUnique({ where: { id: SETTINGS_ID } });
      if (existing) return existing;
      return await prisma.storeSettings.create({ data: { id: SETTINGS_ID } });
    } catch (error) {
      console.error("[data] getStoreSettings:", error);
      return null;
    }
  },
  ["store-settings"],
  { tags: ["store-settings"], revalidate: 300 }
);
