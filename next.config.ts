import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Les fichiers de police lus au runtime par /api/og ne sont pas détectés
  // par le traçage automatique (ils sont ouverts via un chemin construit,
  // pas importés). Sans cette ligne, la route fonctionne en local et échoue
  // une fois déployée, faute de trouver les .ttf.
  outputFileTracingIncludes: {
    "/api/og": ["./app/api/og/fonts/**"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "smmrsifrxmmpzrasfogv.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // Durcissement de base, sans CSP : le site utilise déjà des <script>
  // inline (init du thème, JSON-LD) qu'une CSP stricte casserait sans un
  // vrai système de nonce — à traiter séparément plutôt qu'en aveugle.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Vercel l'ajoute déjà par défaut sur un domaine de prod HTTPS —
          // explicite ici pour ne pas en dépendre silencieusement.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

// L'upload des source maps (le plugin webpack Sentry) a besoin d'org/projet/
// jeton — tant qu'ils ne sont pas configurés sur Vercel, on exporte la config
// telle quelle plutôt que de risquer un échec de build sur une intégration
// pas encore branchée. Le SDK runtime (captureException, etc.) fonctionne
// déjà via SENTRY_DSN, indépendamment de ceci.
const sentryBuildConfigured = Boolean(
  process.env.SENTRY_ORG && process.env.SENTRY_PROJECT && process.env.SENTRY_AUTH_TOKEN
);

export default sentryBuildConfigured
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: true,
      widenClientFileUpload: true,
      disableLogger: true,
    })
  : nextConfig;
