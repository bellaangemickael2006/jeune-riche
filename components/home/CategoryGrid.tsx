import ProductShowcase, { type ShowcaseItem } from "@/components/home/ProductShowcase";
import SectionHeader from "@/components/ui/SectionHeader";
import { ButtonLink } from "@/components/ui/Button";
import { getServerTranslation } from "@/lib/i18n/server";

// La section s'ouvrait sur un marquee "JEUNE RICHE" en boucle suivi d'un
// titre à gauche et d'un lien à droite : un en-tête de section interchangeable.
// Remplacé par un chapitrage de magazine — numéro, intitulé, compte réel des
// pièces — et une sortie de section alignée à droite, sous la grille.
export default async function CategoryGrid({ items }: { items: ShowcaseItem[] }) {
  const { t } = await getServerTranslation();

  return (
    <section className="py-20 md:py-32">
      <SectionHeader
        index="02"
        title={t("home.ourPieces")}
        meta={t("catalogue.pieceCount", { count: items.length })}
      />

      {items.length > 0 ? (
        <ProductShowcase items={items} />
      ) : (
        <p className="text-body px-5 text-paper/40 md:px-10">{t("home.noProducts")}</p>
      )}

      <div className="mt-16 flex justify-end px-5 md:mt-24 md:px-10">
        <ButtonLink href="/catalogue" variant="text" size="md">
          {t("home.viewFullCatalogue")}
        </ButtonLink>
      </div>
    </section>
  );
}
