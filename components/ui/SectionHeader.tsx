import { cn } from "@/lib/utils";

// Ouverture commune à toutes les sections du site : un filet pleine largeur,
// l'intitulé en Fraunces, une méta factuelle à droite. C'est ce qui donne au
// site une lecture de sommaire plutôt qu'une succession de blocs sans lien —
// et ça garantit que deux sections ne s'ouvrent jamais de deux manières
// différentes.
//
// Fraunces et non Anton : un intitulé de section est une phrase de la
// maison, pas une étiquette d'interface.
export default function SectionHeader({
  title,
  meta,
  className,
}: {
  title: string;
  meta?: string;
  className?: string;
}) {
  return (
    <div className={cn("px-5 md:px-10", className)}>
      <div className="flex items-baseline justify-between gap-6 border-t border-line pt-5">
        <h2 className="min-w-0 font-editorial text-heading leading-none text-paper md:text-[2.75rem]">
          {title}
        </h2>
        {meta && <span className="text-label shrink-0 text-paper/30">{meta}</span>}
      </div>
    </div>
  );
}
