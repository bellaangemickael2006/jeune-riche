import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import EmptyState from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Drops" };

const STATUS_LABEL: Record<string, string> = {
  COMING_SOON: "Bientôt",
  PRE_ORDER: "Précommande",
  AVAILABLE: "Disponible",
  SOLD_OUT: "Épuisé",
  ENDED: "Terminé",
};

async function getDrops() {
  try {
    return await prisma.drop.findMany({ orderBy: { startsAt: "asc" } });
  } catch {
    return [];
  }
}

export default async function DropsPage() {
  const drops = await getDrops();

  return (
    <div className="min-h-screen bg-ink px-5 pb-24 pt-32 md:px-10 md:pt-40">
      <h1 className="font-editorial text-heading-lg leading-[1.05] text-paper md:text-[4rem]">Drops</h1>

      {drops.length === 0 ? (
        <EmptyState
          message="Aucun drop pour le moment — le prochain sera annoncé ici."
          cta={{ label: "Voir le catalogue", href: "/catalogue" }}
        />
      ) : (
        <ul className="mt-12 divide-y divide-line">
          {drops.map((d) => (
            <li key={d.id} className="flex flex-col gap-1 py-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-display text-xl uppercase text-paper">{d.name}</p>
                {d.description && <p className="mt-1 max-w-md text-body text-paper/50">{d.description}</p>}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-caption text-paper/40">{d.startsAt.toLocaleDateString("fr-FR")}</span>
                <span className="border border-line px-3 py-1 text-label text-paper/70">
                  {STATUS_LABEL[d.status]}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
