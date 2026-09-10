import Image from "next/image";
import SectionHeader from "@/components/ui/SectionHeader";
import FadeIn from "@/components/ui/FadeIn";
import Spotlight from "@/components/ui/Spotlight";
import { ButtonLink } from "@/components/ui/Button";
import { getServerTranslation } from "@/lib/i18n/server";

// La citation était centrée au milieu d'un carré vide — la composition la
// plus neutre possible. Elle tient maintenant une colonne décalée à droite,
// le badge débordant du cadre à gauche : la page se lit en diagonale au lieu
// de se replier sur son axe. Le spotlight au curseur reste la seule
// interaction spéciale du site (le curseur personnalisé global a été retiré),
// et il est ici parce que c'est la seule section sans vêtement à regarder.
export default async function ManifesteTeaser() {
  const { t } = await getServerTranslation();

  return (
    <Spotlight as="section" size={600} className="relative overflow-hidden py-20 md:py-32">
      <SectionHeader index="04" title={t("navigation.manifesto")} />

      {/* Le badge sort du cadre par la gauche : un motif, pas une vignette. */}
      <Image
        src="/images/badge/badge-black-on-white.png"
        alt=""
        aria-hidden
        width={600}
        height={600}
        className="pointer-events-none absolute -left-[30%] top-1/3 h-[90vw] w-[90vw] max-w-none opacity-[0.05] md:-left-[12%] md:h-[46vw] md:w-[46vw]"
      />

      <div className="relative z-10 grid grid-cols-1 px-5 md:grid-cols-12 md:px-10">
        <FadeIn y={24} className="mt-12 md:col-span-6 md:col-start-6 md:mt-24">
          <p className="font-editorial text-[1.75rem] leading-[1.2] text-paper md:text-[3rem] md:leading-[1.1]">
            {t("home.manifestoQuote")}
          </p>
          <div className="mt-10 md:mt-14">
            <ButtonLink href="/manifeste" variant="text" size="md">
              {t("home.enterUniverse")}
            </ButtonLink>
          </div>
        </FadeIn>
      </div>
    </Spotlight>
  );
}
