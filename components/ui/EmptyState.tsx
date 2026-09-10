import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";

// L'état vide était une boîte encadrée, centrée, avec le logo en filigrane
// au milieu — la mise en page la plus neutre possible pour un moment qui
// compte (une recherche sans résultat, un panier vide). Recomposé comme le
// reste du site : filet en haut, texte aligné à gauche en éditorial, crest
// décalé hors axe. Aucun cadre, aucun centrage.
export default function EmptyState({
  message,
  cta,
}: {
  message: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div className="relative mt-16 overflow-hidden border-t border-line pb-20 pt-12 md:pb-28 md:pt-16">
      <Image
        src="/images/logo/logo-transparent.png"
        alt=""
        aria-hidden
        width={280}
        height={280}
        className="jr-logo pointer-events-none absolute -right-8 top-0 h-48 w-48 object-contain opacity-[0.05] md:h-64 md:w-64"
      />
      <p className="relative max-w-md font-editorial text-heading leading-tight text-paper/70">
        {message}
      </p>
      {cta && (
        <div className="relative mt-8">
          <ButtonLink href={cta.href} variant="text" size="md">
            {cta.label}
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
