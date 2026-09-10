"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import FadeIn from "@/components/ui/FadeIn";
import NewsletterForm from "@/components/layout/NewsletterForm";

// Renseigner ici les URLs réelles dès qu'elles sont communiquées — tant
// qu'un champ est vide, le réseau correspondant s'affiche sans lien plutôt
// que de pointer vers une URL inventée.
const SOCIAL_LINKS = {
  Instagram: "https://www.instagram.com/jeune._.riche/",
  TikTok: "https://www.tiktok.com/@jeune._.riche1",
  Facebook: "https://www.facebook.com/profile.php?id=61592911476140",
  Snapchat: "https://www.snapchat.com/add/jeune_riche01?share_id=bmUySqcSYr8&locale=fr-FR",
};

// Le footer était une grille de quatre colonnes égales avec des icônes de
// réseaux : la signature d'un pied de page SaaS. Recomposé en ours de
// magazine — le wordmark occupe toute la largeur, puis les liens courent sur
// une seule ligne séparés par des filets, et les réseaux sont écrits en
// toutes lettres plutôt qu'en pictogrammes (le texte suffit, cf. règle
// d'iconographie du design system).
export default function Footer() {
  const { t } = useTranslation();

  const NAV_LINKS = [
    { label: t("navigation.collection"), href: "/catalogue" },
    { label: t("navigation.manifesto"), href: "/manifeste" },
    { label: t("navigation.drops"), href: "/drops" },
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
          className="block font-display uppercase leading-[0.78] tracking-[-0.02em] text-paper transition-opacity hover:opacity-80"
        >
          <span className="block text-[26vw] md:hidden">Jeune</span>
          <span className="block text-[26vw] md:hidden">Riche</span>
          <span className="hidden text-[16.5vw] md:block">Jeune Riche</span>
        </Link>
      </FadeIn>

      <div className="mt-12 px-5 md:mt-16 md:px-10">
        {/* Navigation en ligne continue, comme un ours de magazine. */}
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line py-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-label text-paper/60 transition-colors hover:text-paper"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Réseaux nommés, pas d'icônes génériques. */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line py-6">
          {Object.entries(SOCIAL_LINKS).map(([name, href]) =>
            href ? (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-label text-paper/60 transition-colors hover:text-paper"
              >
                {name}
              </a>
            ) : (
              <span key={name} className="text-label text-paper/25">
                {name}
              </span>
            )
          )}
        </div>

        {/* Newsletter : une ligne, pas un encart. */}
        <div className="grid gap-4 border-t border-line py-8 md:grid-cols-[1fr_1.2fr] md:items-center md:gap-10">
          <p className="text-body max-w-sm text-paper/50">{t("footer.newsletter")}</p>
          <NewsletterForm />
        </div>

        <div className="flex flex-col gap-2 border-t border-line py-6 text-caption text-paper/30 sm:flex-row sm:items-center sm:justify-between">
          <span>{t("footer.copyright", { year: new Date().getFullYear() })}</span>
          <span>{t("footer.location")}</span>
        </div>
      </div>
    </footer>
  );
}
