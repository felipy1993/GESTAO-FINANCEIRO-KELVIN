const CACHE_NAME = 'financeiro-kelvin-v4'; // Incremented version to force update
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png',
  '/logo.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force update
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Ignorar requisições para extensões do Chrome ou outros esquemas que não sejam http/https
  if (!event.request.url.startsWith('http')) return;

  // Estratégia Network First para tudo, garantindo dados sempre frescos
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Se a rede responder, atualiza o cache e retorna
        if (event.request.method === 'GET' && networkResponse && networkResponse.status === 200) {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cacheCopy);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Se a rede falhar (offline), tenta buscar no cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          
          // Se for uma navegação e não tiver cache, retorna o index.html principal
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});
