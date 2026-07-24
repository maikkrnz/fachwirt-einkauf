// Service Worker für "Fachwirt Einkauf" – ermöglicht Offline-Nutzung als installierte App.
// Datei muss im selben Ordner wie index.html und manifest.json liegen.

const CACHE_NAME = 'fachwirt-einkauf-v2';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192-dark.png'
];

// Beim Installieren: Kern-Dateien in den Cache legen (Fehler bei einzelnen Dateien werden ignoriert,
// falls z.B. ein Icon-Name nicht exakt passt).
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        CORE_ASSETS.map((url) => cache.add(url).catch(() => {}))
      );
    })
  );
  self.skipWaiting();
});

// Beim Aktivieren: alte Cache-Versionen aufräumen.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Strategie: Netzwerk zuerst (für aktuelle Inhalte), bei Offline auf Cache zurückfallen.
// Damit funktioniert die App auch ohne Internetverbindung mit dem zuletzt geladenen Stand.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => {
        return cached || caches.match('./index.html');
      }))
  );
});
