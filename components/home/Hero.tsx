"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import WordPullUp from "@/components/ui/WordPullUp";
import TextScramble from "@/components/ui/TextScramble";
import Magnetic from "@/components/ui/Magnetic";
import FadeIn from "@/components/ui/FadeIn";

// La vidéo de showroom a été retirée du hero sur décision du client : c'est
// désormais le badge de marque qui tient le fond, comme le faisait déjà le
// repli en cas d'échec de lecture. Le fichier reste dans public/video/ et
// pourra être remplacé par un autre visuel plus tard.
export default function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative flex h-[100svh] w-full items-end overflow-hidden bg-ink">
      <Image
        src="/images/badge/badge-white-on-black.png"
        alt="JEUNE RICHE"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

      {/* Superposée à une vidéo/photo réelle, pas au fond de page : reste
          toujours sombre pour le contraste du texte blanc, quel que soit le
          thème choisi (bg-ink/text-paper suivraient le thème et casseraient
          la lisibilité en mode clair). */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-black/40" />

      <div className="relative z-10 flex w-full flex-col gap-8 px-5 pb-14 md:px-10 md:pb-20">
        <TextScramble
          text={t("home.tagline")}
          immediate
          className="font-body text-xs uppercase tracking-widest2 text-white/70"
        />
        <WordPullUp
          text="Jeune Riche"
          as="h1"
          immediate
          className="font-display max-w-3xl text-[13vw] uppercase leading-[0.92] text-white md:text-[7vw]"
        />
        <FadeIn delay={0.5} immediate className="flex flex-wrap items-center gap-6">
          <Magnetic strength={0.4}>
            <Link
              href="/catalogue"
              className="inline-block bg-paper px-8 py-4 text-xs uppercase tracking-widest2 text-ink transition-transform duration-300 ease-editorial hover:scale-[1.02]"
            >
              {t("home.viewCatalogue")}
            </Link>
          </Magnetic>
          <Link
            href="/manifeste"
            className="text-xs uppercase tracking-widest2 text-white/80 underline underline-offset-4 transition-colors hover:text-white"
          >
            {t("home.readManifesto")}
          </Link>
        </FadeIn>
      </div>

      <div className="absolute bottom-6 right-6 hidden flex-col items-center gap-2 text-white/50 md:flex">
        <span className="text-[10px] uppercase tracking-widest2 [writing-mode:vertical-rl]">{t("home.scroll")}</span>
        <span className="h-10 w-px animate-pulse bg-white/40" />
      </div>
    </section>
  );
}
