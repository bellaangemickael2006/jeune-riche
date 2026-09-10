"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import WordPullUp from "@/components/ui/WordPullUp";
import FadeIn from "@/components/ui/FadeIn";
import { ButtonLink } from "@/components/ui/Button";

export type HeroFeature = {
  name: string;
  slug: string;
  image: string | null;
};

// Le hero était une vidéo plein cadre avec le texte posé par-dessus un
// dégradé noir — la composition la plus reconnaissable des pages d'accueil
// générées : elle ne dit rien de la marque et écrase le vêtement.
//
// Remplacé par une composition en deux zones franches, séparées par un
// filet : le bloc typographique respire dans l'encre, à gauche, posé bas
// avec beaucoup de vide au-dessus ; une bande studio pleine hauteur tient
// la droite avec une vraie pièce du catalogue, sur son fond de studio réel.
// Aucun texte par-dessus l'image, aucun dégradé : le vêtement reste lisible
// comme dans un magazine, et le contraste encre/papier fait tout le travail.
export default function Hero({ feature }: { feature?: HeroFeature }) {
  const { t } = useTranslation();

  return (
    <section className="relative border-b border-line bg-ink">
      {/* Sur mobile, la bande produit est bornée à 42svh : au-delà, le bloc
          typographique passait sous la ligne de flottaison et le premier
          écran ne montrait plus la marque, seulement un vêtement. */}
      <div className="grid h-[100svh] grid-cols-1 grid-rows-[42svh_1fr] md:h-auto md:min-h-[92vh] md:grid-cols-[1.65fr_1fr] md:grid-rows-1">
        {/* Zone typographique — alignée en bas, pas centrée. */}
        <div className="order-2 flex flex-col justify-end px-5 pb-10 pt-8 md:order-1 md:px-10 md:pb-16 md:pt-24">
          <FadeIn immediate y={12}>
            <p className="text-label text-paper/40">{t("home.tagline")}</p>
          </FadeIn>

          <WordPullUp
            text="Jeune"
            as="h1"
            immediate
            className="mt-5 block font-display text-[17vw] uppercase leading-[0.82] text-paper md:mt-10 md:text-[11vw]"
          />
          {/* Deuxième ligne décalée : la marque se lit en deux temps plutôt
              qu'en un bloc centré. */}
          <WordPullUp
            text="Riche"
            as="p"
            immediate
            stagger={0.08}
            className="block font-display text-[17vw] uppercase leading-[0.82] text-paper md:ml-[12%] md:text-[11vw]"
          />

          <FadeIn delay={0.35} immediate className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 md:mt-14">
            <ButtonLink href="/catalogue" variant="primary">
              {t("home.viewCatalogue")}
            </ButtonLink>
            <ButtonLink href="/manifeste" variant="text">
              {t("home.readManifesto")}
            </ButtonLink>
          </FadeIn>
        </div>

        {/* Bande studio — la pièce, sur son fond réel, sans surcouche. */}
        <div className="relative order-1 border-line bg-studio md:order-2 md:border-l">
          {feature?.image ? (
            <Link href={`/catalogue/${feature.slug}`} className="group block h-full w-full">
              <Image
                src={feature.image}
                alt={feature.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 40vw"
                // Le bandeau fixe recouvre le haut de la bande produit sur
                // mobile (la bande démarre à y=0) : la marge haute dégage la
                // pièce plutôt que de la laisser passer sous le logo.
                className="object-contain p-8 pb-20 pt-28 transition-transform duration-[1200ms] ease-editorial group-hover:scale-[1.03] md:p-14"
              />
              {/* Légende de magazine : hors de l'image, sur un filet. */}
              <span className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4 border-t border-ink/15 pt-3 md:bottom-8 md:left-8 md:right-8">
                <span className="font-editorial text-base text-ink">{feature.name}</span>
                <span className="text-label whitespace-nowrap text-ink/50 transition-colors group-hover:text-ink">
                  {t("home.discover")}
                </span>
              </span>
            </Link>
          ) : (
            <Image
              src="/images/badge/badge-black-on-white.png"
              alt="JEUNE RICHE"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-contain p-12"
            />
          )}
        </div>
      </div>
    </section>
  );
}
