"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type Cat = { slug: string; name: string };

// Les filtres étaient des chips encadrées, alignées en grille — le motif
// d'interface le plus interchangeable qui soit. Ici, ce sont des mots :
// l'actif se distingue par la couleur pleine et un filet dessous, rien
// d'autre. La sélection se lit, elle ne s'encadre pas.
function filterClasses(active: boolean) {
  return cn(
    "text-label relative pb-2 transition-colors",
    active ? "text-paper" : "text-paper/40 hover:text-paper/80"
  );
}

export default function CategoryFilters({
  categories,
  active,
  allLabel,
}: {
  categories: Cat[];
  active?: string;
  allLabel: string;
}) {
  const items = [{ slug: "", name: allLabel }, ...categories];

  return (
    <div className="flex flex-wrap items-baseline gap-x-7 gap-y-3">
      {items.map((cat) => {
        const isActive = cat.slug ? active === cat.slug : !active;
        return (
          <Link
            key={cat.slug || "all"}
            href={cat.slug ? `/catalogue?categorie=${cat.slug}` : "/catalogue"}
            className={filterClasses(isActive)}
          >
            {cat.name}
            {isActive && <span className="absolute inset-x-0 bottom-0 h-px bg-paper" />}
          </Link>
        );
      })}
    </div>
  );
}
