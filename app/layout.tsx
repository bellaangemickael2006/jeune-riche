import type { Metadata } from "next";
import { Anton, Fraunces, Inter } from "next/font/google";
import { MotionConfig } from "framer-motion";
import "./globals.css";
import SiteChrome from "@/components/providers/SiteChrome";
import StoreHydration from "@/components/providers/StoreHydration";
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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "JEUNE RICHE",
    template: "%s — JEUNE RICHE",
  },
  description: "JEUNE RICHE — luxe streetwear, identité tribale.",
  openGraph: {
    title: "JEUNE RICHE",
    description: "JEUNE RICHE — luxe streetwear, identité tribale.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JEUNE RICHE",
  },
};

// Doit s'exécuter avant l'hydratation React pour éviter un flash du mauvais
// thème (le choix de l'utilisateur ne vit que dans localStorage, inconnu du
// rendu serveur) — voir ThemeToggle.tsx pour la même logique côté clic.
const THEME_INIT_SCRIPT = `
  (function () {
    try {
      var stored = localStorage.getItem("theme");
      if (stored === "light") document.documentElement.setAttribute("data-theme", "light");
    } catch (e) {}
  })();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${anton.variable} ${fraunces.variable} ${inter.variable}`}
      // Le script ci-dessous pose data-theme AVANT l'hydratation (lu depuis
      // localStorage, inconnu du rendu serveur) — un avertissement
      // d'hydratation sur CET attribut précis est donc attendu, pas un vrai
      // bug ; suppressHydrationWarning ne masque rien d'autre dans l'arbre.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="bg-ink font-body text-paper antialiased">
        <StoreHydration />
        <MotionConfig reducedMotion="user">
          <SiteChrome>{children}</SiteChrome>
        </MotionConfig>
      </body>
    </html>
  );
}
