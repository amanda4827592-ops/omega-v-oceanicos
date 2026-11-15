/**
 * OCEANICOS Ω∞v Service Worker
 * Provides offline caching, resilient asset pre-caching, and PWA installation support.
 * Cache-first for static assets, network-first for API calls, offline fallback for navigation.
 */

const CACHE_NAME = 'oceanicos-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/omega-mark.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install: pre-cache the shell & brand assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for static, navigation fallback
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API calls: always network-first
  if (url.pathname.startsWith('/v1/') || url.port === '5000') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // SSE streams: never cache
  if (url.pathname.includes('/stream')) {
    return;
  }

  // Navigation requests: network-first with offline shell fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/'))
    );
    return;
  }

  // Static assets: cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Only cache successful same-origin responses
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
