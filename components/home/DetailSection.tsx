import Image from "next/image";
import SectionHeader from "@/components/ui/SectionHeader";
import FadeIn from "@/components/ui/FadeIn";
import { ButtonLink } from "@/components/ui/Button";
import { getServerTranslation } from "@/lib/i18n/server";

// Deux visuels réels du t-shirt blanc dormaient dans public/ sans être
// affichés nulle part : la pièce sur cintre dans une vraie scène, et le gros
// plan col + crest. Ce sont les seuls assets du projet qui ne soient pas un
// aplat de studio — c'est donc ici que le site peut enfin montrer la matière
// et le placement plutôt que de les décrire. Rien n'est affirmé sur la
// composition du textile : on ne nomme que ce qui est visible à l'image.
export default async function DetailSection({ href }: { href: string }) {
  const { t } = await getServerTranslation();

  return (
    <section className="py-20 md:py-32">
      <SectionHeader index="03" title={t("home.detailTitle")} meta={t("home.detailMeta")} />

      <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 px-5 md:mt-16 md:grid-cols-12 md:px-10">
        {/* La scène — grande, à gauche, sans surcouche de texte. */}
        <FadeIn y={24} className="md:col-span-7">
          <div className="relative aspect-[5/4] overflow-hidden">
            <Image
              src="/images/products/tshirt-blanc/lifestyle-hanging.jpg"
              alt={t("home.detailAltHanging")}
              fill
              sizes="(max-width: 768px) 100vw, 58vw"
              className="object-cover"
            />
          </div>
        </FadeIn>

        {/* Le texte tient la colonne étroite, aligné bas : trois phrases
            courtes qui nomment ce que l'on voit, rien de plus. */}
        <FadeIn y={24} delay={0.1} className="flex flex-col justify-end md:col-span-4 md:col-start-9 md:pb-2">
          <p className="font-editorial text-heading leading-tight text-paper md:text-[2rem]">
            {t("home.detailLine1")}
            <br />
            {t("home.detailLine2")}
            <br />
            <span className="text-paper/50">{t("home.detailLine3")}</span>
          </p>
          <div className="mt-8">
            <ButtonLink href={href} variant="secondary" size="sm">
              {t("home.detailCta")}
            </ButtonLink>
          </div>
        </FadeIn>

        {/* Le gros plan, décalé et recadré serré sur le col et le crest. */}
        <FadeIn y={24} delay={0.15} className="md:col-span-5 md:col-start-4 md:-mt-16">
          <div className="relative aspect-[16/10] overflow-hidden">
            <Image
              src="/images/products/tshirt-blanc/detail-neck-label.jpg"
              alt={t("home.detailAltNeck")}
              fill
              sizes="(max-width: 768px) 100vw, 42vw"
              className="scale-[1.6] object-cover object-[52%_38%]"
            />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
