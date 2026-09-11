"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import FadeIn from "@/components/ui/FadeIn";
import NewsletterForm from "@/components/layout/NewsletterForm";
import { WHATSAPP_NUMBER } from "@/lib/utils";

// Renseigner ici les URLs réelles dès qu'elles sont communiquées — tant
// qu'un champ est vide, le réseau s'affiche sans lien plutôt que de pointer
// vers une URL inventée.
const SOCIAL = {
  Instagram: "https://www.instagram.com/jeune._.riche/",
  TikTok: "https://www.tiktok.com/@jeune._.riche1",
  Facebook: "https://www.facebook.com/profile.php?id=61592911476140",
  Snapchat: "https://www.snapchat.com/add/jeune_riche01?share_id=bmUySqcSYr8&locale=fr-FR",
};

// Le pied de page était une grille de quatre colonnes égales surmontant des
// pictogrammes de réseaux : la structure exacte d'un pied de page SaaS.
// Recomposé en ours de magazine — le wordmark tient toute la largeur, les
// liens courent sur une seule ligne, et les réseaux sont écrits en toutes
// lettres (quand le mot suffit, le mot vaut mieux qu'une icône).
export default function Footer() {
  const { t } = useTranslation();

  const LINKS = [
    { label: t("navigation.collection"), href: "/catalogue" },
    { label: t("navigation.atelier"), href: "/atelier" },
    { label: t("navigation.manifesto"), href: "/manifeste" },
    { label: t("navigation.drops"), href: "/drops" },
    { label: t("navigation.about"), href: "/a-propos" },
    { label: t("footer.shipping"), href: "/livraison" },
    { label: t("footer.returns"), href: "/retours" },
    { label: t("footer.contact"), href: "/contact" },
    { label: t("footer.terms"), href: "/conditions" },
    { label: t("footer.privacy"), href: "/confidentialite" },
  ];

  return (
    <footer className="border-t border-line bg-ink">
      {/* Dernière scène : le wordmark seul, à l'échelle de la page. */}
      <FadeIn className="overflow-hidden px-5 pt-20 md:px-10 md:pt-28">
        <Link
          href="/"
          aria-label="JEUNE RICHE — accueil"
          className="block font-display uppercase leading-[0.78] tracking-[-0.02em] text-paper transition-opacity hover:opacity-70"
        >
          <span className="block text-[26vw] md:hidden">Jeune</span>
          <span className="block text-[26vw] md:hidden">Riche</span>
          <span className="hidden text-[16.5vw] md:block">Jeune Riche</span>
        </Link>
      </FadeIn>

      <div className="mt-14 px-5 md:mt-20 md:px-10">
        {/* Navigation en ligne continue plutôt qu'en colonnes. */}
        <nav className="flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-line py-7">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-label text-paper/55 transition-colors hover:text-paper"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* WhatsApp est un canal de vente, pas un widget de support : il tient
            sa place dans l'ours, en toutes lettres, à côté des réseaux. */}
        <div className="flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-line py-7">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-label text-paper transition-opacity hover:opacity-60"
          >
            WhatsApp
          </a>
          {Object.entries(SOCIAL).map(([name, href]) =>
            href ? (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-label text-paper/55 transition-colors hover:text-paper"
              >
                {name}
              </a>
            ) : (
              <span key={name} className="text-label text-paper/20">
                {name}
              </span>
            )
          )}
        </div>

        {/* Newsletter sur une ligne, pas dans un encart. */}
        <div className="grid gap-5 border-t border-line py-8 md:grid-cols-[1fr_1.15fr] md:items-center md:gap-12">
          <p className="text-body max-w-sm text-paper/50">{t("footer.newsletter")}</p>
          <NewsletterForm />
        </div>

        <div className="flex flex-col gap-2 border-t border-line py-7 text-caption text-paper/30 sm:flex-row sm:items-center sm:justify-between">
          <span>{t("footer.copyright", { year: new Date().getFullYear() })}</span>
          <span>{t("footer.location")}</span>
        </div>
      </div>
    </footer>
  );
}
