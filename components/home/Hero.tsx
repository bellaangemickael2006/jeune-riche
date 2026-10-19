"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import WordPullUp from "@/components/ui/WordPullUp";
import TextScramble from "@/components/ui/TextScramble";
import Magnetic from "@/components/ui/Magnetic";
import FadeIn from "@/components/ui/FadeIn";
import type { HomeContent } from "@/lib/home/content";

// La vidéo de showroom a été retirée du hero sur décision du client. Le fond
// est maintenant une vraie photo de la marque (portant d'atelier) plutôt que
// le badge recadré qui servait de repli : c'est le seul visuel fourni en
// assez haute définition (1400×1600) pour tenir un plein cadre sans se
// dégrader. Le cadrage privilégie le haut de l'image — le portant et la
// pièce — parce qu'en format paysage le bas se retrouve rogné.
// Le fichier vidéo reste dans public/video/ pour un usage ultérieur.
// Photo, cadrage et assombrissement se règlent dans Admin → Page d'accueil.
export default function Hero({ content }: { content: HomeContent["hero"] }) {
  const { t } = useTranslation();

  return (
    <section className="relative flex h-[100svh] w-full items-end overflow-hidden bg-ink">
      <Image
        src={content.url}
        alt={content.alt || "T-shirt JEUNE RICHE noir sur un portant d'atelier"}
        fill
        priority
        sizes="100vw"
        className="object-cover"
        style={{ objectPosition: `${content.focusX}% ${content.focusY}%` }}
      />

      {/* Superposée à une photo réelle, pas au fond de page : reste toujours
          sombre pour le contraste du texte blanc, quel que soit le thème
          choisi (bg-ink/text-paper suivraient le thème et casseraient la
          lisibilité en mode clair). Assombrissement concentré en bas, là où
          le texte se pose — le haut de la photo reste lisible. */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to top, #000 0%, rgba(0,0,0,${content.overlay / 100}) 50%, rgba(0,0,0,${(content.overlay * 0.8) / 100}) 100%)`,
        }}
      />

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
