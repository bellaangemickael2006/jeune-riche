"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import { ActionLink } from "@/components/ui/Action";

// La vidéo de showroom a été retirée du hero sur décision du client. Le fond
// est maintenant une vraie photo de la marque (portant d'atelier) plutôt que
// le badge recadré qui servait de repli : c'est le seul visuel fourni en
// assez haute définition (1400×1600) pour tenir un plein cadre sans se
// dégrader. Le cadrage privilégie le haut de l'image — le portant et la
// pièce — parce qu'en format paysage le bas se retrouve rogné.
// Le fichier vidéo reste dans public/video/ pour un usage ultérieur.
export default function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative flex h-[100svh] w-full items-end overflow-hidden bg-ink">
      <Image
        src="/images/campagne/portant-atelier.jpg"
        alt="T-shirt JEUNE RICHE noir sur un portant d'atelier"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_38%]"
      />

      {/* Superposée à une photo réelle, pas au fond de page : reste toujours
          sombre pour le contraste du texte blanc, quel que soit le thème
          choisi (bg-ink/text-paper suivraient le thème et casseraient la
          lisibilité en mode clair). Assombrissement concentré en bas, là où
          le texte se pose — le haut de la photo reste lisible. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/20" />

      {/* L'accroche brouillait ses lettres à l'ouverture (scramble) et le
          wordmark montait mot par mot : deux animations qui retardaient la
          lecture du premier écran sans rien dire de la marque.

          Surtout, le bloc entier était parqué à opacity:0 en attendant une
          animation au montage — si le JavaScript tarde, échoue, ou si le
          navigateur throttle les frames (onglet en arrière-plan, économie
          d'énergie), le nom de la marque reste invisible. Le premier écran
          ne dépend plus d'aucune animation : il est là, au repos. */}
      <div className="relative z-10 flex w-full flex-col gap-7 px-5 pb-14 md:px-10 md:pb-20">
        <p className="text-label text-white/60">{t("home.tagline")}</p>

        <h1 className="max-w-3xl font-display text-[13vw] uppercase leading-[0.9] text-white md:text-[7vw]">
          Jeune Riche
        </h1>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <ActionLink href="/catalogue" family="engager">
            {t("home.viewCatalogue")}
          </ActionLink>
          <ActionLink href="/manifeste" family="passer" className="text-white/70 hover:text-white">
            {t("home.readManifesto")}
          </ActionLink>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 hidden flex-col items-center gap-2 text-white/50 md:flex">
        <span className="text-[10px] uppercase tracking-widest2 [writing-mode:vertical-rl]">{t("home.scroll")}</span>
        <span className="h-10 w-px animate-pulse bg-white/40" />
      </div>
    </section>
  );
}
