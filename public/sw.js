/**
 * Service Worker для Trae
 * Забезпечує офлайн-функціональність та оптимізацію кешування
 */

const CACHE_NAME = 'trae-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/main.js',
  '/static/css/main.css',
  '/favicon.ico',
  '/manifest.json'
];

// Встановлення Service Worker та кешування статичних ресурсів
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Активація Service Worker та видалення старих кешів
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

// Стратегія кешування: stale-while-revalidate
// Повертає кешований ресурс, якщо він є, і одночасно оновлює кеш
self.addEventListener('fetch', (event) => {
  // Пропускаємо запити до API
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  // Пропускаємо запити з методом, відмінним від GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            // Кешуємо отриману відповідь, якщо вона успішна
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => {
            // Якщо мережевий запит не вдався, повертаємо резервний ресурс для HTML запитів
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/');
            }
            return null;
          });
        
        // Повертаємо кешований ресурс або результат мережевого запиту
        return cachedResponse || fetchPromise;
      });
    })
  );
});

// Обробка повідомлень від клієнта
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});