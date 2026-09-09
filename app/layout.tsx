import type { Metadata } from "next";
import { Anton, Fraunces, Inter } from "next/font/google";
import { MotionConfig } from "framer-motion";
import "./globals.css";
import SiteChrome from "@/components/providers/SiteChrome";
import StoreHydration from "@/components/providers/StoreHydration";
import I18nProvider from "@/components/providers/I18nProvider";
import { getLocale, getServerTranslation, loadResource } from "@/lib/i18n/server";
import { getDirection } from "@/lib/i18n/languages";
import { siteUrl } from "@/lib/utils";

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["italic", "normal"],
  weight: ["400", "500"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Titre/description traduits selon la langue résolue (cookie ou
// Accept-Language) — metadataBase reste fixe, ce n'est pas un contenu
// linguistique.
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslation();
  const description = t("meta.description");
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: "JEUNE RICHE",
      template: "%s — JEUNE RICHE",
    },
    description,
    openGraph: {
      title: "JEUNE RICHE",
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "JEUNE RICHE",
    },
  };
}

// Doit s'exécuter avant l'hydratation React pour éviter un flash du mauvais
// thème (le choix de l'utilisateur ne vit que dans localStorage, inconnu du
// rendu serveur) — voir ThemeToggle.tsx pour la même logique côté clic. La
// langue n'a pas besoin de cet artifice : elle est résolue via cookie donc
// déjà correcte dès le premier rendu serveur (voir getLocale ci-dessous).
const THEME_INIT_SCRIPT = `
  (function () {
    try {
      var stored = localStorage.getItem("theme");
      if (stored === "light") document.documentElement.setAttribute("data-theme", "light");
    } catch (e) {}
  })();
`;

// Organization + WebSite schema.org sur chaque page — sert de base à la
// carte de connaissance Google et à la sitelinks search box, sans dépendre
// d'une page précise pour être présent.
const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "ClothingStore",
  name: "JEUNE RICHE",
  url: siteUrl(),
  logo: `${siteUrl()}/images/logo/logo-transparent.png`,
  sameAs: [
    "https://www.instagram.com/jeune._.riche/",
    "https://www.tiktok.com/@jeune._.riche1",
    "https://www.facebook.com/profile.php?id=61592911476140",
    "https://www.snapchat.com/add/jeune_riche01?share_id=bmUySqcSYr8&locale=fr-FR",
  ],
  address: { "@type": "PostalAddress", addressCountry: "CI" },
};

const WEBSITE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "JEUNE RICHE",
  url: siteUrl(),
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const dir = getDirection(locale);
  const initialResource = await loadResource(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${anton.variable} ${fraunces.variable} ${inter.variable}`}
      // Le script ci-dessous pose data-theme AVANT l'hydratation (lu depuis
      // localStorage, inconnu du rendu serveur) — un avertissement
      // d'hydratation sur CET attribut précis est donc attendu, pas un vrai
      // bug ; suppressHydrationWarning ne masque rien d'autre dans l'arbre.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD).replace(/</g, "\\u003c") }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSON_LD).replace(/</g, "\\u003c") }}
        />
      </head>
      <body className="bg-ink font-body text-paper antialiased">
        <I18nProvider initialLocale={locale} initialResource={initialResource}>
          <StoreHydration />
          <MotionConfig reducedMotion="user">
            <SiteChrome>{children}</SiteChrome>
          </MotionConfig>
        </I18nProvider>
      </body>
    </html>
  );
}
