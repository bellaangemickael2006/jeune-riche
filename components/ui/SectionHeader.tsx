import { cn } from "@/lib/utils";

// Chapitrage commun à toutes les sections de l'accueil : un numéro, un
// intitulé, une méta à droite, le tout posé sur un filet pleine largeur.
// C'est ce qui donne au site une lecture de sommaire de magazine plutôt
// qu'une succession de blocs indépendants — et ça garantit que deux
// sections ne s'ouvrent jamais de deux manières différentes.
export default function SectionHeader({
  index,
  title,
  meta,
  className,
}: {
  index: string;
  title: string;
  meta?: string;
  className?: string;
}) {
  return (
    <div className={cn("px-5 md:px-10", className)}>
      <div className="flex items-baseline justify-between gap-6 border-t border-line pt-4">
        <div className="flex min-w-0 items-baseline gap-5">
          <span className="text-label shrink-0 tabular-nums text-paper/30">{index}</span>
          <h2 className="truncate font-display text-2xl uppercase tracking-wide text-paper md:text-4xl">
            {title}
          </h2>
        </div>
        {meta && <span className="text-label shrink-0 text-paper/30">{meta}</span>}
      </div>
    </div>
  );
}
