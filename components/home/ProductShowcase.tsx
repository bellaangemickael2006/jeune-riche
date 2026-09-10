import Image from "next/image";
import Link from "next/link";
import { cn, formatPrice } from "@/lib/utils";
import FadeIn from "@/components/ui/FadeIn";

export type ShowcaseItem = {
  name: string;
  slug: string;
  image: string | null;
  price: number | null;
};

// Rythme éditorial explicite : chaque pièce occupe une place voulue dans la
// grille 12 colonnes, avec ses propres proportions et son propre décalage
// vertical. Avant, toutes les vignettes partageaient le même traitement en
// grille régulière — c'est ce qui donnait l'impression d'un catalogue
// généré. Ici, aucune ligne n'est identique à la précédente : les vides
// font partie de la composition, exactement comme dans une double page de
// magazine. Les pièces au-delà du sixième slot reprennent le rythme depuis
// le début, la marque n'en publie pas assez pour justifier plus.
const RHYTHM = [
  { col: "md:col-span-7 md:col-start-1", aspect: "aspect-[4/5]", offset: "", size: "lg" },
  { col: "md:col-span-4 md:col-start-9", aspect: "aspect-[3/4]", offset: "md:mt-32", size: "sm" },
  { col: "md:col-span-3 md:col-start-2", aspect: "aspect-[3/4]", offset: "md:mt-16", size: "sm" },
  { col: "md:col-span-5 md:col-start-7", aspect: "aspect-[4/5]", offset: "md:-mt-16", size: "md" },
  { col: "md:col-span-4 md:col-start-1", aspect: "aspect-[16/13]", offset: "md:mt-24", size: "sm" },
  { col: "md:col-span-5 md:col-start-7", aspect: "aspect-[3/4]", offset: "md:mt-8", size: "md" },
] as const;

export default function ProductShowcase({ items }: { items: ShowcaseItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-14 px-5 md:grid-cols-12 md:gap-x-6 md:gap-y-0 md:px-10">
      {items.map((item, i) => {
        const slot = RHYTHM[i % RHYTHM.length];
        return (
          <FadeIn
            key={item.slug}
            y={20}
            delay={(i % 3) * 0.06}
            className={cn("col-span-1", slot.col, slot.offset)}
          >
            <Piece item={item} aspect={slot.aspect} size={slot.size} index={i} />
          </FadeIn>
        );
      })}
    </div>
  );
}

function Piece({
  item,
  aspect,
  size,
  index,
}: {
  item: ShowcaseItem;
  aspect: string;
  size: "sm" | "md" | "lg";
  index: number;
}) {
  return (
    <Link href={`/catalogue/${item.slug}`} className="group block">
      <div className={cn("relative overflow-hidden bg-studio", aspect)}>
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            priority={index === 0}
            sizes="(max-width: 768px) 50vw, 45vw"
            className="object-contain p-6 transition-transform duration-[900ms] ease-editorial group-hover:scale-[1.04] md:p-12"
          />
        ) : (
          <div className="h-full w-full bg-line/40" />
        )}
      </div>
      {/* Le nom et le prix vivent sous l'image, sur un filet — pas dans une
          carte, pas en surimpression sur le vêtement. */}
      <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-line pt-3">
        <span
          className={cn(
            "min-w-0 font-editorial text-paper transition-opacity group-hover:opacity-70",
            size === "lg" ? "text-heading" : size === "md" ? "text-xl" : "text-base"
          )}
        >
          {item.name}
        </span>
        <span className="text-caption shrink-0 tabular-nums text-paper/45">
          {item.price !== null ? formatPrice(item.price) : ""}
        </span>
      </div>
    </Link>
  );
}
