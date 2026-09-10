import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import FadeIn from "@/components/ui/FadeIn";

export type ShowcaseItem = {
  name: string;
  slug: string;
  image: string | null;
};

// Composition éditoriale asymétrique plutôt qu'une grille de cartes
// identiques : une pièce en avant (grande), deux en médaillon, le reste en
// petit format — le rythme vient de la mise en page, pas d'un défilement
// automatique permanent.
export default function ProductShowcase({ items }: { items: ShowcaseItem[] }) {
  if (items.length === 0) return null;

  const [feature, ...rest] = items;
  const mid = rest.slice(0, 2);
  const small = rest.slice(2);

  return (
    <div className="grid grid-cols-2 gap-3 px-5 md:grid-cols-6 md:gap-5 md:px-10">
      <FadeIn className="col-span-2 md:col-span-3 md:row-span-2">
        <Tile
          item={feature}
          aspect="aspect-[4/5] md:aspect-auto md:h-full"
          textSize="text-heading md:text-heading-lg"
          sizes="(max-width: 768px) 100vw, 45vw"
          priority
        />
      </FadeIn>

      {mid.map((item, i) => (
        <FadeIn key={item.slug} delay={0.08 * (i + 1)} className="col-span-1 md:col-span-3">
          <Tile
            item={item}
            aspect="aspect-[4/5] md:aspect-[16/10]"
            textSize="text-body md:text-heading"
            sizes="(max-width: 768px) 50vw, 30vw"
          />
        </FadeIn>
      ))}

      {small.map((item, i) => (
        <FadeIn key={item.slug} delay={0.08 * (i + 3)} className="col-span-1 md:col-span-2">
          <Tile
            item={item}
            aspect="aspect-[4/5]"
            textSize="text-caption md:text-body"
            sizes="(max-width: 768px) 50vw, 20vw"
          />
        </FadeIn>
      ))}
    </div>
  );
}

function Tile({
  item,
  aspect,
  textSize,
  sizes,
  priority = false,
}: {
  item: ShowcaseItem;
  aspect: string;
  textSize: string;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/catalogue/${item.slug}`}
      className={cn("group relative block overflow-hidden bg-studio", aspect)}
    >
      {item.image ? (
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes={sizes}
          priority={priority}
          className="object-contain p-6 transition-transform duration-700 ease-editorial group-hover:scale-105 md:p-10"
        />
      ) : (
        <div className="h-full w-full bg-line" />
      )}
      {/* Superposé à la photo produit, pas au fond de page : reste toujours
          sombre pour que le nom en blanc reste lisible en mode clair. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      <p className={cn("absolute bottom-4 left-4 font-editorial md:bottom-6 md:left-6", textSize, "text-white")}>
        {item.name}
      </p>
    </Link>
  );
}
