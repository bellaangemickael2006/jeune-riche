import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0B0B0C",
        paper: "#F5F4F1",
        navy: "#131B2E",
        line: "#26252A",
        studio: "#E1DED8", // fond neutre unique pour la photographie produit (catalogue, fiches produit)
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      // Échelle typographique du design system (voir ART_DIRECTION.md §3bis).
      // Nommage sémantique par rôle, pas par taille — un "label" reste un
      // label si l'échelle change un jour. N'écrase aucune taille Tailwind
      // par défaut (text-xs, text-3xl, etc. restent disponibles) : usage
      // additif pour les composants reconstruits progressivement.
      fontSize: {
        label: ["0.6875rem", { lineHeight: "1", letterSpacing: "0.22em" }],
        caption: ["0.8125rem", { lineHeight: "1.4" }],
        body: ["0.9375rem", { lineHeight: "1.65" }],
        heading: ["1.75rem", { lineHeight: "1.15" }],
        "heading-lg": ["2.75rem", { lineHeight: "1.05" }],
        display: ["3.5rem", { lineHeight: "0.95" }],
      },
      letterSpacing: {
        widest2: "0.22em",
      },
      transitionTimingFunction: {
        editorial: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
