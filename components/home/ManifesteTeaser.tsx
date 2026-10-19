import Image from "next/image";
import Link from "next/link";
import FadeIn from "@/components/ui/FadeIn";
import Magnetic from "@/components/ui/Magnetic";
import Spotlight from "@/components/ui/Spotlight";
import { getServerTranslation } from "@/lib/i18n/server";
import type { HomeContent } from "@/lib/home/content";

// Image de fond et transparence réglées dans Admin → Page d'accueil.
export default async function ManifesteTeaser({ content }: { content: HomeContent["manifeste"] }) {
  const { t } = await getServerTranslation();

  return (
    <Spotlight
      as="section"
      size={700}
      className="flex min-h-[70vh] items-center justify-center overflow-hidden bg-ink px-5 py-24 text-center md:px-10"
    >
      {content.url && content.opacity > 0 && (
        <Image
          src={content.url}
          alt=""
          aria-hidden
          width={600}
          height={600}
          className="pointer-events-none absolute left-1/2 top-1/2 h-[140vw] w-[140vw] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain md:h-[60vw] md:w-[60vw]"
          style={{ opacity: content.opacity / 100 }}
        />
      )}
      <FadeIn className="relative z-10 flex max-w-2xl flex-col items-center gap-8" y={20}>
        <p className="text-xs uppercase tracking-widest2 text-paper/50">{t("navigation.manifesto")}</p>
        <p className="font-editorial text-2xl italic leading-snug text-paper md:text-4xl">
          {t("home.manifestoQuote")}
        </p>
        <Magnetic strength={0.3}>
          <Link
            href="/manifeste"
            className="inline-block text-xs uppercase tracking-widest2 text-paper underline underline-offset-4 transition-opacity hover:opacity-70"
          >
            {t("home.enterUniverse")}
          </Link>
        </Magnetic>
      </FadeIn>
    </Spotlight>
  );
}
