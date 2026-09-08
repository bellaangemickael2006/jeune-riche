"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type Cat = { slug: string; name: string };

// Filtres en texte et en filet, pas en chips encadrées : sept rectangles
// bordés dont l'actif s'inverse en aplat, c'était une barre de filtres de
// tableau de bord. Ici la sélection se lit à la valeur du texte et au filet
// sous le mot actif — rien d'autre.
export default function CategoryFilters({
  categories,
  active,
}: {
  categories: Cat[];
  active?: string;
}) {
  const items = [{ slug: "", name: "Tout" }, ...categories];

  return (
    <div className="flex flex-wrap items-baseline gap-x-7 gap-y-3 md:gap-x-9">
      {items.map((cat) => {
        const isActive = cat.slug ? active === cat.slug : !active;
        return (
          <Link
            key={cat.slug || "all"}
            href={cat.slug ? `/catalogue?categorie=${cat.slug}` : "/catalogue"}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "border-b pb-1 text-label transition-colors duration-300 ease-editorial",
              isActive
                ? "border-paper text-paper"
                : "border-transparent text-paper/40 hover:text-paper/70"
            )}
          >
            {cat.name}
          </Link>
        );
      })}
    </div>
  );
}
