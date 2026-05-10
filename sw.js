const CACHE_NAME = 'splitit-v1';

// Pliki wymagane do uruchomienia aplikacji bez dostępu do sieci
const ASSETS = [
  'index.html',
  'style.css',
  'script.js',
  'manifest.json'
];

// Instalacja
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

// Wzorzec "Cache First" - najpierw szukamy w pamięci podręcznej, potem w internecie.
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(res => {
      return res || fetch(e.request);
    })
  );
});