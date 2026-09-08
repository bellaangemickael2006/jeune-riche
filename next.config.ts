import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
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
  eslint: {
    ignoreDuringBuilds: false,
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
