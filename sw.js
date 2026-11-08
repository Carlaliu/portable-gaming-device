/* Tunnel Raider service worker.
   The game shell is cached on install, so it plays fully offline. Every visit, every return to the
   network and every 30 minutes the page asks for this file again; when its version changes the new
   shell downloads in the background and the page offers a RESTART instead of interrupting a game. */
const VERSION = '1f3be67bbb4c';
const SHELL = `tr-shell-${VERSION}`;
const RUNTIME = 'tr-runtime-v1';   // fonts and anything else fetched later
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
  './favicon.ico',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-192.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL).then(cache => cache.addAll(ASSETS.map(url => new Request(url, { cache: 'reload' })))));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith('tr-shell-') && key !== SHELL) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data && event.data.type === 'VERSION') event.source && event.source.postMessage({ type: 'VERSION', version: VERSION });
});

// Installed apps on Chromium can check for updates in the background, even when closed.
self.addEventListener('periodicsync', event => {
  if (event.tag === 'tr-update') event.waitUntil(self.registration.update());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    if (req.mode === 'navigate') {
      // the page: straight from the cache, so it opens instantly and offline
      event.respondWith(caches.match('./index.html', { cacheName: SHELL }).then(hit => hit || fetch(req)));
      return;
    }
    if (url.pathname.endsWith('/sw.js')) return;
    event.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(RUNTIME).then(c => c.put(req, copy)); }
      return res;
    })));
    return;
  }

  // Google Fonts: serve the cached copy, refresh it when online
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(caches.open(RUNTIME).then(async cache => {
      const hit = await cache.match(req);
      const net = fetch(req).then(res => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    }));
  }
});
