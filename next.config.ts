import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { adminGateRewrites } from "./lib/admin/gate";
import { suspiciousPublicEnv } from "./lib/security/publicEnv";

// Une variable NEXT_PUBLIC_* est publiée dans le code des navigateurs : si sa
// valeur contient autre chose (une 2e ligne, « SECRET=… »), on refuse de
// compiler plutôt que de publier un secret (voir lib/security/publicEnv.ts).
const badPublicEnv = suspiciousPublicEnv(process.env);
if (badPublicEnv.length > 0) {
  throw new Error(
    `Variable(s) publique(s) mal collée(s) dans Vercel : ${badPublicEnv.join(", ")}. ` +
      "Leur valeur contient plusieurs lignes ou une autre variable : corriger la valeur (une seule par variable) puis redéployer."
  );
}

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
  experimental: {
    // Les pages sont rendues à chaque visite (CSP à jeton unique, voir
    // lib/security/csp.ts) : le navigateur garde 30 s les pages déjà vues ou
    // préchargées, pour que revenir en arrière ou rouvrir le catalogue soit
    // instantané. Prix et stock restent revérifiés au panier et au paiement.
    staleTimes: { dynamic: 30, static: 180 },
  },
  // Administration cachée derrière une entrée secrète (lib/admin/gate.ts).
  async rewrites() {
    return { beforeFiles: adminGateRewrites(), afterFiles: [], fallback: [] };
  },
  // Durcissement de base. La CSP, elle, est posée par proxy.ts : elle porte
  // un jeton différent à chaque visite.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          // Une page ouverte depuis le site (lien WhatsApp, etc.) ne peut pas
          // agir sur l'onglet du site, et inversement (anti-« tabnabbing »).
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Vercel l'ajoute déjà par défaut sur un domaine de prod HTTPS —
          // explicite ici pour ne pas en dépendre silencieusement.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
      // Vidéos, images et icônes du dossier public : sans cela, Vercel les sert
      // en « max-age=0 » et le navigateur redemande chaque fichier (dont les
      // 20 Mo de la vidéo d'accueil) à chaque visite. Un jour de cache, puis
      // une semaine où l'ancienne version reste servie pendant la mise à jour.
      {
        source: "/:dir(video|images|icons)/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
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
