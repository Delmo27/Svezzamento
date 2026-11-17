/* Svezzamento PWA - cache dell'involucro applicativo. I dati condivisi restano su Firebase. */
const CACHE = 'svezzamento-pwa-v7-20261117';
const CORE = [
  './', './index.html', './config.js', './manifest.webmanifest',
  './logo-svezzamento.svg', './favicon.ico', './favicon-16x16.png', './favicon-32x32.png',
  './apple-touch-icon.png', './icon-192.png', './icon-512.png',
  './maskable-icon-192.png', './maskable-icon-512.png', './safari-pinned-tab.svg', './browserconfig.xml'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('svezzamento-pwa-') && key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/config.js')) {
    event.respondWith(
      fetch(request).then(response => {
        if (response.ok) caches.open(CACHE).then(cache => cache.put(request, response.clone()));
        return response;
      }).catch(async () => (await caches.match(request)) || (await caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) caches.open(CACHE).then(cache => cache.put(request, response.clone()));
      return response;
    }))
  );
});
