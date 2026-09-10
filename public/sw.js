// Service worker de JEUNE RICHE — cache minimal fait main plutôt qu'une
// dépendance (next-pwa...) : le site vend en temps réel (stock, prix, codes
// promo), donc les pages et l'API ne doivent JAMAIS servir une réponse
// cachée périmée. Seuls les fichiers statiques immuables (bundles Next
// hachés, images, polices) profitent d'un cache-first — c'est ce qui rend
// les visites répétées rapides sur un réseau mobile instable, sans jamais
// risquer d'afficher un stock ou un prix obsolète.
const CACHE_VERSION = "v1";
const STATIC_CACHE = `jr-static-${CACHE_VERSION}`;
const PAGES_CACHE = `jr-pages-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

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
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(PAGES_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => (await caches.match(request)) || caches.match(OFFLINE_URL))
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
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            return response;
          })
      )
    );
  }
});
