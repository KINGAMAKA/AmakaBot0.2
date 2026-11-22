// Service worker: caches the app so it opens offline. Bump CACHE when you want a clean refresh.
const CACHE = 'amaka-v0.2.0';
const ASSETS = ['./', 'index.html', 'style.css', 'main.js', 'face.js', 'chat.js', 'settings.js', 'status.js', 'memory.js', 'memory-ui.js', 'voice.js', 'brain.js', 'sensors.js',
  'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Cached copy first (fast, offline), refreshed in the background so updates arrive on the next open.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => {
    const net = fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => hit || caches.match('index.html'));
    return hit || net;
  }));
});
