import ProductShowcase, { type ShowcaseItem } from "@/components/home/ProductShowcase";
import SectionHeader from "@/components/ui/SectionHeader";
import { ActionLink } from "@/components/ui/Action";
import { getServerTranslation } from "@/lib/i18n/server";

// La section s'ouvrait sur un marquee « JEUNE RICHE » défilant en boucle,
// puis sur un titre qui montait mot par mot. Deux motifs décoratifs qui ne
// portaient aucune information et qu'on retrouve sur n'importe quel site
// généré. Remplacés par un chapitrage de magazine — intitulé, compte réel
// des pièces — et une sortie de section sous la grille.
export default async function CategoryGrid({ items }: { items: ShowcaseItem[] }) {
  const { t } = await getServerTranslation();

  return (
    <section className="py-20 md:py-28">
      <SectionHeader
        title={t("home.ourPieces")}
        meta={t("catalogue.pieceCount", { count: items.length })}
      />

      {items.length > 0 ? (
        <ProductShowcase items={items} />
      ) : (
        <p className="px-5 text-body text-paper/40 md:px-10">{t("home.noProducts")}</p>
      )}

      <div className="mt-14 flex justify-end px-5 md:mt-20 md:px-10">
        <ActionLink href="/catalogue" family="passer">
          {t("home.viewFullCatalogue")}
        </ActionLink>
      </div>
    </section>
  );
}
