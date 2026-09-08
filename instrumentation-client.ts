import * as Sentry from "@sentry/nextjs";

// Le DSN est prévu pour être public par conception (voir doc Sentry) : il ne
// donne aucun accès en lecture/écriture au projet, seulement le droit
// d'y envoyer des événements — d'où le préfixe NEXT_PUBLIC_.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
});
