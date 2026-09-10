import Image from "next/image";
import WordPullUp from "@/components/ui/WordPullUp";
import FadeIn from "@/components/ui/FadeIn";
import { ButtonLink } from "@/components/ui/Button";
import { getServerTranslation } from "@/lib/i18n/server";

// Expérience éditoriale en plusieurs temps plutôt qu'un bloc "titre + 3
// paragraphes" : chaque section respire seule, la composition alterne
// asymétriquement, et les seuls visuels utilisés sont des assets réels de la
// marque (badge, photo produit) — aucune photographie de campagne n'existe
// encore, donc aucune n'est simulée ici.

export default async function ManifesteBody() {
  const { t } = await getServerTranslation();

  return (
    <div className="bg-ink">
      {/* Temps 1 — affirmation, plein cadre, asymétrique à gauche */}
      <section className="px-5 py-28 md:px-10 md:py-40">
        <WordPullUp
          text={t("manifesto.section1")}
          as="h2"
          className="max-w-4xl font-editorial text-heading text-paper md:text-[4.5rem] md:leading-[1.05]"
        />
      </section>

      {/* Temps 2 — texte / image, colonnes inégales */}
      <section className="grid gap-10 border-t border-line px-5 py-20 md:grid-cols-[1fr_1.1fr] md:gap-16 md:px-10 md:py-28">
        <FadeIn className="flex flex-col justify-center">
          <p className="font-editorial text-heading text-paper">{t("manifesto.section2Title")}</p>
          <p className="mt-6 max-w-sm text-body leading-relaxed text-paper/50">{t("manifesto.section2Body")}</p>
        </FadeIn>
        <FadeIn delay={0.1} x={24} className="relative aspect-[4/5] overflow-hidden bg-studio">
          <Image
            src="/images/products/tshirt-noir/mockup-1-neutral.jpg"
            alt={t("manifesto.imageAlt1")}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain p-10"
          />
        </FadeIn>
      </section>

      {/* Temps 3 — le symbole en grand, asymétrique à droite */}
      <section className="grid gap-10 border-t border-line px-5 py-20 md:grid-cols-[1fr_1fr] md:gap-16 md:px-10 md:py-28">
        <FadeIn x={-24} className="relative order-2 aspect-square overflow-hidden bg-ink md:order-1">
          <Image
            src="/images/badge/badge-white-on-black.png"
            alt={t("manifesto.imageAlt2")}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain p-6 opacity-90"
          />
        </FadeIn>
        <FadeIn className="order-1 flex flex-col justify-center md:order-2">
          <p className="text-label text-paper/40">{t("manifesto.section3Label")}</p>
          <p className="mt-4 max-w-md font-editorial text-heading text-paper">{t("manifesto.section3Body")}</p>
        </FadeIn>
      </section>

      {/* Temps 4 — clôture, retour au plein cadre */}
      <section className="border-t border-line px-5 py-28 text-center md:px-10 md:py-40">
        <WordPullUp
          text={t("manifesto.section4")}
          as="h2"
          className="mx-auto max-w-3xl font-editorial text-heading text-paper md:text-[3.5rem] md:leading-[1.1]"
        />
        <FadeIn delay={0.3} className="mt-12">
          <ButtonLink href="/catalogue" variant="primary">
            {t("manifesto.viewCollection")}
          </ButtonLink>
        </FadeIn>
      </section>
    </div>
  );
}
