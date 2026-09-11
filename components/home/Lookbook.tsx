import Image from "next/image";
import Link from "next/link";
import WordPullUp from "@/components/ui/WordPullUp";
import FadeIn from "@/components/ui/FadeIn";
import { getServerTranslation } from "@/lib/i18n/server";

// Deux vraies photos portées fournies par la marque. Elles sont affichées à
// deux colonnes sur grand écran et non en pleine largeur : les fichiers font
// ~700px de large, les étirer davantage les rendrait floues. Les légendes ne
// décrivent que ce qui est visible à l'image (impression au dos, crest
// poitrine) — rien n'est affirmé sur la matière ou la coupe.
const SHOTS = [
  {
    src: "/images/campagne/porte-dos-ciel.jpg",
    altKey: "home.wornAltBack",
    captionKey: "home.wornCaptionBack",
  },
  {
    src: "/images/campagne/porte-voiture.jpg",
    altKey: "home.wornAltFront",
    captionKey: "home.wornCaptionFront",
  },
] as const;

export default async function Lookbook() {
  const { t } = await getServerTranslation();

  return (
    <section className="py-20 md:py-32">
      <div className="mb-10 flex items-end justify-between px-5 md:px-10">
        <WordPullUp
          text={t("home.wornTitle")}
          as="h2"
          className="font-display text-3xl uppercase text-paper md:text-5xl"
        />
        <Link
          href="/catalogue"
          className="hidden text-xs uppercase tracking-widest2 text-paper/60 underline underline-offset-4 hover:text-paper md:block"
        >
          {t("home.viewFullCatalogue")}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-10 px-5 md:grid-cols-2 md:px-10">
        {SHOTS.map((shot, i) => (
          <FadeIn key={shot.src} y={20} delay={i * 0.08}>
            <div className="relative aspect-square overflow-hidden bg-ink">
              <Image
                src={shot.src}
                alt={t(shot.altKey)}
                fill
                sizes="(max-width: 768px) 100vw, 45vw"
                className="object-cover"
              />
            </div>
            <p className="mt-3 text-xs uppercase tracking-widest2 text-paper/40">
              {t(shot.captionKey)}
            </p>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
