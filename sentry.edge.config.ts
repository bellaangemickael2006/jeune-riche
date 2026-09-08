import * as Sentry from "@sentry/nextjs";

// Couvre le runtime Edge (middleware.ts) — config séparée du serveur Node
// car les deux runtimes ne partagent pas les mêmes APIs.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.2,
});
