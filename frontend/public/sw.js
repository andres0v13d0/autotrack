const CACHE_NAME = 'autotrack-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/logo.jpeg',
  '/manifest.json'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('✅ Cache opened');
      return cache.addAll(urlsToCache).catch(err => {
        console.warn('⚠️ Some assets failed to cache:', err);
        // Continue even if some assets fail to cache
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', event => {
  // Skip non-GET requests and API calls
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      // Cache hit - return response
      if (response) {
        return response;
      }

      return fetch(event.request).then(response => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Return offline page or cached response
        return caches.match('/index.html');
      });
    })
  );
});

// Background sync for offline work orders
self.addEventListener('sync', event => {
  if (event.tag === 'sync-work-orders') {
    event.waitUntil(
      // Sync pending work orders when back online
      fetch('/api/work-orders/pending').catch(() => Promise.resolve())
    );
  }
});

// Handle push notifications (optional)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/logo.jpeg',
    badge: '/logo.jpeg',
    tag: 'autotrack-notification',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification('AutoTrack', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (let client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
