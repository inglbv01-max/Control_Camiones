const CACHE_NAME = 'control-camiones-v1';
const urlsToCache = [
  './index.html',
  './style.css',
  './app.js',
  './db.js',
  './manifest.json'
];

// Instalar el Service Worker y cachear archivos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activar el SW
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME)
      .map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Interceptar requests y servir desde cache si está offline
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request)
    )
  );
});
