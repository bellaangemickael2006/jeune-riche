// Politique de sécurité du contenu (CSP) : liste des seules sources que le
// navigateur accepte d'exécuter ou de contacter. Si une faille d'injection
// apparaissait un jour, un script étranger serait bloqué au lieu de
// s'exécuter (vol de session, faux formulaire de paiement…).
//
// Scripts : uniquement ceux portant le jeton à usage unique (nonce) posé par
// proxy.ts à chaque requête — Next.js l'ajoute à ses propres scripts, le
// layout au script du thème. 'strict-dynamic' laisse ces scripts de
// confiance charger leurs morceaux (chunks) sans autre liste.

export function buildCsp(nonce: string, opts: { supabaseUrl?: string; dev?: boolean } = {}): string {
  const supabase = opts.supabaseUrl ? new URL(opts.supabaseUrl).origin : "";
  const supabaseWs = supabase ? supabase.replace(/^https:/, "wss:") : "";
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // 'wasm-unsafe-eval' : décodeurs WebAssembly de la vue 3D (model-viewer).
    // 'unsafe-eval' seulement en développement (rechargement à chaud).
    "script-src": ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", "'wasm-unsafe-eval'", ...(opts.dev ? ["'unsafe-eval'"] : [])],
    // Styles en ligne posés par les animations (framer-motion) et next/font.
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", supabase].filter(Boolean),
    "media-src": ["'self'", "blob:", supabase].filter(Boolean),
    "font-src": ["'self'", "data:"],
    "connect-src": [
      "'self'",
      supabase, // API, stockage (modèles 3D .glb)
      supabaseWs, // temps réel (« N personnes regardent ce drop »)
      "https://www.gstatic.com", // décodeurs Draco/KTX2 de model-viewer
      "https://*.ingest.sentry.io",
      "https://*.ingest.de.sentry.io",
      "https://*.ingest.us.sentry.io",
    ].filter(Boolean),
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    "frame-src": ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  const policy = Object.entries(directives).map(([name, values]) => `${name} ${values.join(" ")}`);
  if (!opts.dev) policy.push("upgrade-insecure-requests");
  return policy.join("; ");
}

/** Jeton aléatoire par requête (128 bits). */
export function makeNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}
