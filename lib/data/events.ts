import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// L'événement actif à l'instant : activé et dont la période couvre maintenant.
// Si plusieurs se chevauchent, le plus récemment commencé l'emporte.
export const getActiveEvent = unstable_cache(
  async () => {
    try {
      const now = new Date();
      return await prisma.seasonalEvent.findFirst({
        where: { enabled: true, startsAt: { lte: now }, endsAt: { gte: now } },
        orderBy: { startsAt: "desc" },
      });
    } catch (error) {
      console.error("[data] getActiveEvent:", error);
      return null;
    }
  },
  ["active-event"],
  // Revalidé toutes les 5 min pour que le début et la fin d'une période
  // s'appliquent d'eux-mêmes, sans action de l'admin.
  { tags: ["seasonal-events"], revalidate: 300 }
);

export async function getAllEvents() {
  try {
    return await prisma.seasonalEvent.findMany({ orderBy: { startsAt: "desc" } });
  } catch (error) {
    console.error("[data] getAllEvents:", error);
    return [];
  }
}
