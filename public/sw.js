/**
 * Service Worker — School Manager RDC
 *
 * Stratégie de cache :
 *  - Precache des ressources statiques essentielles (logo, manifest)
 *  - Cache-first pour les assets Next.js (_next/static) — noms hashés, immuables
 *  - Network-first pour les pages HTML — fallback cache hors connexion
 *  - Network-only pour les API — jamais de cache pour les données serveur
 *  - Stale-while-revalidate pour les images et polices
 *
 * Gestion des mises à jour : le numéro de version change à chaque déploiement.
 * Le SW précédent est supprimé et le nouveau prend le contrôle après skipWaiting.
 */

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `sm-rdc-static-${CACHE_VERSION}`;
const PAGE_CACHE = `sm-rdc-pages-${CACHE_VERSION}`;
const ASSET_CACHE = `sm-rdc-assets-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/logo.png',
  '/logo.svg',
  '/manifest.json',
  '/offline.html',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/icon-maskable-192x192.png',
  '/icon-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.ico'
];

/* ── Installation : precache des ressources essentielles ── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(PRECACHE_URLS).catch(() => undefined)
    )
  );
  self.skipWaiting();
});

/* ── Activation : nettoyage des anciens caches ── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![STATIC_CACHE, PAGE_CACHE, ASSET_CACHE].includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

/* ── Fetch : routage par type de requête ── */
self.addEventListener('fetch', (event) => {
  const { request } = event;

  /* Ignorer les requêtes non GET (POST, PUT, DELETE...) */
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  /* Same-origin only */
  if (url.origin !== self.location.origin) return;

  /* API : network-only, jamais de cache */
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  /* Assets Next.js (_next/static) : cache-first, immuable */
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(ASSET_CACHE).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  /* Images, polices : stale-while-revalidate */
  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|eot)$/i)
  ) {
    event.respondWith(
      caches.open(ASSET_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const fetchPromise = fetch(request)
            .then((response) => {
              if (response.ok) cache.put(request, response.clone());
              return response;
            })
            .catch(() => cached);
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  /* Pages HTML : network-first, fallback cache hors connexion */
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(PAGE_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('/offline.html'))
        )
    );
    return;
  }

  /* Autres ressources GET : stale-while-revalidate */
  event.respondWith(
    caches.open(ASSET_CACHE).then((cache) =>
      cache.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    )
  );
});

/* ── Messages depuis le client ── */
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
