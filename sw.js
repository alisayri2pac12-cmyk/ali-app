// Guarda la app para que funcione sin internet. Cambia VERSION al subir una versión nueva.
const VERSION = 'arbol-ali-v8';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const fromCache = () => caches.match(req, {ignoreSearch: req.mode === 'navigate'}).then(r => r || caches.match('./index.html'));
  // Red primero (para recibir actualizaciones). Si no hay internet o la red tarda más de 4 s, usa la copia guardada.
  const net = fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(VERSION).then(ca => ca.put(req, c)); } return r; });
  e.respondWith(new Promise(resolve => {
    let done = false;
    const t = setTimeout(() => fromCache().then(r => { if (r && !done) { done = true; resolve(r); } }), 4000);
    net.then(r => { clearTimeout(t); if (!done) { done = true; resolve(r.ok ? r : fromCache().then(c => c || r)); } })
       .catch(() => { clearTimeout(t); if (!done) { done = true; resolve(fromCache()); } });
  }));
});
