import Image from "next/image";
import FadeIn from "@/components/ui/FadeIn";
import { ActionLink } from "@/components/ui/Action";
import Spotlight from "@/components/ui/Spotlight";
import { getServerTranslation } from "@/lib/i18n/server";

export default async function ManifesteTeaser() {
  const { t } = await getServerTranslation();

  return (
    <Spotlight
      as="section"
      size={700}
      className="flex min-h-[70vh] items-center justify-center overflow-hidden bg-ink px-5 py-24 text-center md:px-10"
    >
      <Image
        src="/images/badge/badge-black-on-white.png"
        alt=""
        aria-hidden
        width={600}
        height={600}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[140vw] w-[140vw] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-[0.04] md:h-[60vw] md:w-[60vw]"
      />
      <FadeIn className="relative z-10 flex max-w-2xl flex-col items-center gap-8" y={20}>
        <p className="text-xs uppercase tracking-widest2 text-paper/50">{t("navigation.manifesto")}</p>
        <p className="font-editorial text-2xl italic leading-snug text-paper md:text-4xl">
          {t("home.manifestoQuote")}
        </p>
        <ActionLink href="/manifeste" family="passer">
          {t("home.enterUniverse")}
        </ActionLink>
      </FadeIn>
    </Spotlight>
  );
}
