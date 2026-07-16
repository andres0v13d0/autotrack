const CACHE_NAME = 'autotrack-static-v2';

// Install - solo cache assets estáticos
self.addEventListener('install', event => {
  self.skipWaiting();
});

// Activate - limpiar caches viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - network first, nunca cache HTML
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // NUNCA cachear HTML - siempre del servidor
  if (event.request.destination === 'document') {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // NUNCA cachear API calls
  if (url.pathname.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Solo cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Cache assets estáticos (.js, .css, .png, etc)
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
