import Link from "next/link";
import NewsletterForm from "@/components/layout/NewsletterForm";

// Renseigner ici les URLs réelles dès qu'elles sont communiquées — tant
// qu'un champ est vide, l'entrée correspondante s'affiche sans lien plutôt
// que de pointer vers une URL inventée.
const SOCIAL_LINKS: Record<string, string> = {
  Instagram: "https://www.instagram.com/jeune._.riche/",
  TikTok: "https://www.tiktok.com/@jeune._.riche1",
  Facebook: "https://www.facebook.com/profile.php?id=61592911476140",
  Snapchat: "https://www.snapchat.com/add/jeune_riche01?share_id=bmUySqcSYr8&locale=fr-FR",
};

// Le bouton WhatsApp flottant (bulle verte, rounded-full, ombre portée) a été
// retiré : couleur hors palette, forme et ombre interdites, et gadget présent
// sur toutes les pages. Le canal reste disponible — au même endroit que les
// autres moyens de contact, là où la question se pose réellement.
const WHATSAPP_URL = "https://wa.me/2250777585367";

type FooterLink = { label: string; href: string; external?: boolean };

const NAVIGATION: FooterLink[] = [
  { label: "Collection", href: "/catalogue" },
  { label: "Manifeste", href: "/manifeste" },
  { label: "Drops", href: "/drops" },
  { label: "À propos", href: "/a-propos" },
];

const CONTACT: FooterLink[] = [
  { label: "Contact", href: "/contact" },
  { label: "WhatsApp", href: WHATSAPP_URL, external: true },
  { label: "Livraison", href: "/livraison" },
  { label: "Retours", href: "/retours" },
];

const LEGAL: FooterLink[] = [
  { label: "Conditions générales", href: "/conditions" },
  { label: "Confidentialité", href: "/confidentialite" },
];

// Deux colonnes inégales, pas quatre colonnes identiques : le wordmark occupe
// la moitié gauche à lui seul, tout le reste se range à droite. Les icônes
// sociales en aplat SVG sont remplacées par les noms des réseaux — quatre
// pictogrammes alignés étaient le seul endroit du site où l'on dessinait des
// symboles décoratifs.
export default function Footer() {
  return (
    <footer className="border-t border-line bg-ink px-5 pb-10 pt-20 md:px-10 md:pt-28">
      <div className="grid gap-16 md:grid-cols-[1.6fr_1fr] md:gap-10">
        {/* La dernière scène du site : le wordmark, seul, en très grand. Pas de
            logo graphique ici, le texte porte la marque à lui seul. */}
        <Link
          href="/"
          aria-label="JEUNE RICHE — accueil"
          className="block self-start overflow-hidden font-display uppercase leading-[0.82] text-paper transition-opacity duration-300 ease-editorial hover:opacity-75"
        >
          <span className="block text-[19vw] md:text-[11vw]">Jeune</span>
          <span className="block text-[19vw] md:text-[11vw]">Riche</span>
        </Link>

        <div className="flex flex-col gap-12">
          <FooterColumn title="Navigation" links={NAVIGATION} />
          <FooterColumn title="Contact" links={CONTACT} />
          <div>
            <p className="text-label text-paper/35">Réseaux</p>
            <ul className="mt-4 space-y-2.5">
              {Object.entries(SOCIAL_LINKS).map(([label, href]) => (
                <li key={label}>
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-caption text-paper/65 transition-colors duration-300 ease-editorial hover:text-paper"
                    >
                      {label}
                    </a>
                  ) : (
                    <span className="text-caption text-paper/25">{label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-label text-paper/35">Newsletter</p>
            <p className="mt-4 max-w-xs text-caption text-paper/45">
              Soyez informé des prochains drops.
            </p>
            <NewsletterForm />
          </div>
        </div>
      </div>

      <div className="mt-20 flex flex-col gap-3 border-t border-line pt-6 text-caption text-paper/30 sm:flex-row sm:items-center sm:justify-between md:mt-28">
        <span>© {new Date().getFullYear()} Jeune Riche.</span>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {LEGAL.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors duration-300 ease-editorial hover:text-paper/70"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <span>Côte d&apos;Ivoire — Afrique de l&apos;Ouest</span>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <p className="text-label text-paper/35">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            {link.external ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-caption text-paper/65 transition-colors duration-300 ease-editorial hover:text-paper"
              >
                {link.label}
              </a>
            ) : (
              <Link
                href={link.href}
                className="text-caption text-paper/65 transition-colors duration-300 ease-editorial hover:text-paper"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
