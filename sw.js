// Nova Service Worker — enables offline use
const CACHE_NAME = 'nova-v1';
const ASSETS = [
  './nova.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install — cache all core files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Nova SW] Caching app shell');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clear old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — serve from cache, fall back to network
self.addEventListener('fetch', event => {
  // For API calls (Anthropic), always go to network
  if (event.request.url.includes('anthropic.com')) {
    return; // don't intercept API calls
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache new resources as they're fetched
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // If offline and not in cache, return the main app
        return caches.match('./nova.html');
      });
    })
  );
});