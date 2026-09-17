import type { Metadata, Viewport } from "next";
import { Anton, Fraunces, Inter } from "next/font/google";
import { MotionConfig } from "framer-motion";
import "./globals.css";
import SiteChrome from "@/components/providers/SiteChrome";
import StoreHydration from "@/components/providers/StoreHydration";
import I18nProvider from "@/components/providers/I18nProvider";
import PWARegister from "@/components/providers/PWARegister";
import SplashScreen from "@/components/providers/SplashScreen";
import { getLocale, getServerTranslation, loadResource } from "@/lib/i18n/server";
import { getDirection } from "@/lib/i18n/languages";
import { siteUrl } from "@/lib/utils";

// Couleur de la barre d'adresse mobile / de la barre de statut en mode
// standalone (PWA installée) — même teinte que le fond de l'app (--color-ink)
// pour que la transition entre chrome navigateur et contenu soit invisible.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B0B0C",
};

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

  // Image de partage : la photo de campagne portée, dos au ciel. C'est la
  // seule image de la marque qui se lit en vignette de 300 px sans légende.
  // Sans elle, un lien partagé sur WhatsApp — canal principal de la marque —
  // s'affichait en carte de texte nue, alors même que twitter:card promettait
  // une grande image.
  const ogImage = {
    url: "/images/campagne/porte-dos-ciel.jpg",
    width: 696,
    height: 724,
    alt: "T-shirt JEUNE RICHE blanc porté de dos, badge imprimé, ciel d'Abidjan",
  };

  // Le titre par défaut portait le seul nom de la marque : il ne gagnait
  // aucune recherche pour quelqu'un qui ne connaît pas encore JEUNE RICHE.
  // Il dit maintenant ce qu'on vend et où — les deux termes que les gens
  // tapent réellement. Le template des autres pages reste inchangé.
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: "JEUNE RICHE — Streetwear personnalisable à Abidjan",
      template: "%s — JEUNE RICHE",
    },
    description,
    alternates: { canonical: "/" },
    // Vérification de propriété Google Search Console. Sans elle, Google ne
    // découvre le site que par hasard : il n'existe aujourd'hui aucun lien
    // entrant vers le domaine.
    //
    // Ce jeton n'est pas un secret : Google exige qu'il soit servi en clair
    // dans le <head> pour valider la propriété, donc il est public par
    // construction et n'a rien à faire dans un coffre. Il est écrit ici pour
    // que la validation fonctionne sans configuration, et reste surchargeable
    // par GOOGLE_SITE_VERIFICATION — utile le jour où le site passe sur son
    // propre nom de domaine, qui sera une autre propriété pour Google.
    verification: {
      google:
        process.env.GOOGLE_SITE_VERIFICATION ||
        "8dJdSPx8r-U00gBQUgS3Jy9In3OQdr31P4Y2szWvFl4",
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "JEUNE RICHE",
    },
    openGraph: {
      title: "JEUNE RICHE — Streetwear personnalisable à Abidjan",
      description,
      type: "website",
      url: siteUrl(),
      siteName: "JEUNE RICHE",
      locale: "fr_CI",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: "JEUNE RICHE — Streetwear personnalisable à Abidjan",
      description,
      images: [ogImage.url],
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
          <PWARegister />
          <SplashScreen />
          <MotionConfig reducedMotion="user">
            <SiteChrome>{children}</SiteChrome>
          </MotionConfig>
        </I18nProvider>
      </body>
    </html>
  );
}
