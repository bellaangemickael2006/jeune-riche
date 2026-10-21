// Service worker de JEUNE RICHE — cache minimal fait main plutôt qu'une
// dépendance (next-pwa...) : le site vend en temps réel (stock, prix, codes
// promo), donc en ligne, les pages et l'API viennent TOUJOURS du réseau. Le
// cache ne sert qu'en secours, hors connexion : le client voit alors la
// dernière version enregistrée (bandeau « hors connexion », et prix/stock
// revérifiés par le serveur au moment de commander).
// Seuls les fichiers statiques immuables (bundles Next hachés, images,
// polices) profitent d'un cache-first : visites répétées rapides sur un
// réseau mobile instable.
// v2 : ne met plus en cache les réponses en erreur ni les pages personnelles.
// v3 : catalogue et fiches produit gardés d'avance pour la lecture hors
//      connexion (message « warm » envoyé par OfflineSupport.tsx).
// Changer la version vide les anciens caches à l'activation.
const CACHE_VERSION = "v3";
const STATIC_CACHE = `jr-static-${CACHE_VERSION}`;
const PAGES_CACHE = `jr-pages-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";
const MAX_PAGES = 60;
const MAX_WARM = 40;

const PRECACHE_URLS = [OFFLINE_URL, "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== STATIC_CACHE && key !== PAGES_CACHE).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isNextBuildAsset(url) {
  return url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/_next/image");
}

function isStaticAsset(url) {
  return /\.(?:png|jpe?g|webp|avif|svg|gif|ico|woff2?|ttf)$/.test(url.pathname);
}

// Pages propres à un visiteur (compte, panier, commande, liens reçus par
// email) : jamais gardées hors-ligne, pour ne pas réafficher les données
// d'un client à quelqu'un d'autre sur un appareil partagé.
function isPrivatePage(url) {
  return /^\/(compte|panier|checkout|favoris|suivi|auth|desinscription|newsletter)(\/|$)/.test(url.pathname);
}

// Le cache des pages ne grossit pas indéfiniment : les plus anciennes
// entrées partent au-delà de MAX_PAGES.
async function putPage(request, response) {
  const cache = await caches.open(PAGES_CACHE);
  await cache.put(request, response);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_PAGES)).map((key) => cache.delete(key)));
}

// Pages publiques (catalogue, fiches produit…) téléchargées d'avance, une à
// une, sans écraser celles déjà gardées. Seules les adresses internes et
// publiques sont acceptées, quel que soit le message reçu.
async function warm(urls) {
  const cache = await caches.open(PAGES_CACHE);
  for (const raw of urls.slice(0, MAX_WARM)) {
    try {
      const url = new URL(raw, self.location.origin);
      if (url.origin !== self.location.origin || isPrivatePage(url) || url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin")) continue;
      if (await cache.match(url.href)) continue;
      const response = await fetch(url.href, { credentials: "same-origin" });
      if (response.ok && (response.headers.get("content-type") || "").includes("text/html")) await putPage(url.href, response);
    } catch {
      // Réseau coupé en cours de route : on reprendra à la prochaine visite.
      return;
    }
  }
}

self.addEventListener("message", (event) => {
  if (event.origin && event.origin !== self.location.origin) return;
  if (event.data?.type === "warm" && Array.isArray(event.data.urls)) {
    event.waitUntil(warm(event.data.urls.filter((u) => typeof u === "string")));
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Supabase Storage, wa.me, etc. : jamais interceptés
  // API et admin : jamais mis en cache, toujours une réponse fraîche (stock,
  // panier, session admin).
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin")) return;

  // Navigation (chargement de page) : réseau d'abord, cache en secours si
  // hors-ligne ou requête qui échoue, page offline dédiée en dernier recours.
  // (Hors connexion, une navigation interne de Next échoue puis se rabat
  // sur un chargement de page complet, qui arrive ici.)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Une page en erreur (500, 404) gardée en cache serait resservie
          // hors-ligne à la place de la vraie page.
          if (response.ok && !isPrivatePage(url)) {
            const copy = response.clone();
            event.waitUntil(putPage(request, copy));
          }
          return response;
        })
        .catch(async () => (await caches.match(request, { ignoreVary: true })) || caches.match(OFFLINE_URL))
    );
    return;
  }

  // Assets statiques : cache d'abord — immuables par construction (nom de
  // fichier haché pour les bundles Next), donc jamais périmés.
  if (isNextBuildAsset(url) || isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            // Cache-first = définitif : une image en erreur mise en cache ne
            // se serait plus jamais affichée, même après correction.
            if (response.ok) {
              const copy = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
  }
});
