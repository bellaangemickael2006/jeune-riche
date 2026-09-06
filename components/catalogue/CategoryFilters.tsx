"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type Cat = { slug: string; name: string };

export default function CategoryFilters({
  categories,
  active,
}: {
  categories: Cat[];
  active?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/catalogue"
        className={cn(
          "border px-4 py-2 text-xs uppercase tracking-widest2 transition-colors",
          !active ? "border-blood bg-blood text-paper" : "border-line text-paper/60 hover:text-paper"
        )}
      >
        Tout
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat.slug}
          href={`/catalogue?categorie=${cat.slug}`}
          className={cn(
            "border px-4 py-2 text-xs uppercase tracking-widest2 transition-colors",
            active === cat.slug
              ? "border-blood bg-blood text-paper"
              : "border-line text-paper/60 hover:text-paper"
          )}
        >
          {cat.name}
        </Link>
      ))}
    </div>
  );
}
