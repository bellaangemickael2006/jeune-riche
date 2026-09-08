import * as Sentry from "@sentry/nextjs";

// Sans SENTRY_DSN, Sentry.init() ne fait rien (comportement natif du SDK) —
// même logique que le reste du projet : une variable d'env absente
// désactive la fonctionnalité au lieu de faire planter le site.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.2,
});
