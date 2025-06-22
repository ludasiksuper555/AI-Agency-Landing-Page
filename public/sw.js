// Service Worker for Trae AI Agency PWA
// Version 1.0.0

const CACHE_NAME = 'trae-ai-agency-v1';
const STATIC_CACHE_NAME = 'trae-static-v1';
const DYNAMIC_CACHE_NAME = 'trae-dynamic-v1';
const API_CACHE_NAME = 'trae-api-v1';

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only',
};

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/_next/static/css/',
  '/_next/static/js/',
];

// API endpoints to cache
const API_CACHE_PATTERNS = [/\/api\/analytics\/.*/, /\/api\/performance\/.*/, /\/api\/health/];

// Routes that should always go to network
const NETWORK_ONLY_PATTERNS = [/\/api\/auth\/.*/, /\/api\/contact/, /\/api\/upload\/.*/];

// Cache configuration
const CACHE_CONFIG = {
  maxEntries: 100,
  maxAgeSeconds: 24 * 60 * 60, // 24 hours
  purgeOnQuotaError: true,
};

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS.filter(url => !url.includes('_next')));
      }),
      // Skip waiting to activate immediately
      self.skipWaiting(),
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              return (
                cacheName !== STATIC_CACHE_NAME &&
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName !== API_CACHE_NAME
              );
            })
            .map(cacheName => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      // Claim all clients
      self.clients.claim(),
    ])
  );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  event.respondWith(handleFetch(request));
});

// Main fetch handler
async function handleFetch(request) {
  const url = new URL(request.url);

  try {
    // Handle different types of requests
    if (isStaticAsset(url)) {
      return await handleStaticAsset(request);
    } else if (isAPIRequest(url)) {
      return await handleAPIRequest(request);
    } else if (isPageRequest(url)) {
      return await handlePageRequest(request);
    } else {
      return await handleDynamicRequest(request);
    }
  } catch (error) {
    console.error('[SW] Fetch error:', error);
    return await handleOffline(request);
  }
}

// Check if request is for static asset
function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)
  );
}

// Check if request is for API
function isAPIRequest(url) {
  return url.pathname.startsWith('/api/');
}

// Check if request is for a page
function isPageRequest(url) {
  return url.pathname === '/' || (!url.pathname.includes('.') && !url.pathname.startsWith('/api/'));
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Static asset fetch failed:', error);
    throw error;
  }
}

// Handle API requests
async function handleAPIRequest(request) {
  const url = new URL(request.url);

  // Network-only for sensitive endpoints
  if (NETWORK_ONLY_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return await fetch(request);
  }

  // Cache-friendly API endpoints
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return await handleCacheableAPI(request);
  }

  // Default to network-first for other APIs
  return await handleNetworkFirst(request, API_CACHE_NAME);
}

// Handle cacheable API requests with stale-while-revalidate
async function handleCacheableAPI(request) {
  const cache = await caches.open(API_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  // Start network request in background
  const networkPromise = fetch(request)
    .then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }

  // Wait for network if no cache
  return (await networkPromise) || createErrorResponse('API unavailable offline');
}

// Handle page requests with network-first strategy
async function handlePageRequest(request) {
  return await handleNetworkFirst(request, DYNAMIC_CACHE_NAME);
}

// Handle dynamic requests
async function handleDynamicRequest(request) {
  return await handleNetworkFirst(request, DYNAMIC_CACHE_NAME);
}

// Network-first strategy
async function handleNetworkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Handle offline scenarios
async function handleOffline(request) {
  const url = new URL(request.url);

  // Return offline page for navigation requests
  if (isPageRequest(url)) {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const offlinePage = await cache.match('/offline');
    if (offlinePage) {
      return offlinePage;
    }
  }

  // Return error response for other requests
  return createErrorResponse('Content unavailable offline');
}

// Create error response
function createErrorResponse(message) {
  return new Response(JSON.stringify({ error: message, offline: true }), {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'application/json' },
  });
}

// Background sync for form submissions
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'contact-form') {
    event.waitUntil(syncContactForm());
  } else if (event.tag === 'analytics-data') {
    event.waitUntil(syncAnalyticsData());
  }
});

// Sync contact form submissions
async function syncContactForm() {
  try {
    const db = await openDB();
    const pendingForms = await getAllPendingForms(db);

    for (const form of pendingForms) {
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form.data),
        });

        if (response.ok) {
          await deletePendingForm(db, form.id);
          console.log('[SW] Contact form synced successfully');
        }
      } catch (error) {
        console.error('[SW] Failed to sync contact form:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Sync analytics data
async function syncAnalyticsData() {
  try {
    const db = await openDB();
    const pendingAnalytics = await getAllPendingAnalytics(db);

    for (const analytics of pendingAnalytics) {
      try {
        const response = await fetch('/api/analytics/web-vitals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(analytics.data),
        });

        if (response.ok) {
          await deletePendingAnalytics(db, analytics.id);
          console.log('[SW] Analytics data synced successfully');
        }
      } catch (error) {
        console.error('[SW] Failed to sync analytics data:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Analytics sync failed:', error);
  }
}

// Push notifications
self.addEventListener('push', event => {
  console.log('[SW] Push notification received');

  const options = {
    body: 'You have new updates from Trae AI Agency',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore',
        icon: '/icons/action-explore.png',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/action-close.png',
      },
    ],
  };

  if (event.data) {
    const payload = event.data.json();
    options.body = payload.body || options.body;
    options.data = { ...options.data, ...payload.data };
  }

  event.waitUntil(self.registration.showNotification('Trae AI Agency', options));
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(clients.openWindow('/'));
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(clients.openWindow('/'));
  }
});

// Cache management utilities
async function cleanupCaches() {
  const cacheNames = await caches.keys();

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();

    if (requests.length > CACHE_CONFIG.maxEntries) {
      // Remove oldest entries
      const entriesToDelete = requests.slice(0, requests.length - CACHE_CONFIG.maxEntries);
      await Promise.all(entriesToDelete.map(request => cache.delete(request)));
    }
  }
}

// Periodic cache cleanup
setInterval(cleanupCaches, 60 * 60 * 1000); // Every hour

// IndexedDB utilities for offline storage
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TraeOfflineDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = event => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('pendingForms')) {
        db.createObjectStore('pendingForms', { keyPath: 'id', autoIncrement: true });
      }

      if (!db.objectStoreNames.contains('pendingAnalytics')) {
        db.createObjectStore('pendingAnalytics', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getAllPendingForms(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingForms'], 'readonly');
    const store = transaction.objectStore('pendingForms');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function getAllPendingAnalytics(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingAnalytics'], 'readonly');
    const store = transaction.objectStore('pendingAnalytics');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function deletePendingForm(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingForms'], 'readwrite');
    const store = transaction.objectStore('pendingForms');
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

function deletePendingAnalytics(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingAnalytics'], 'readwrite');
    const store = transaction.objectStore('pendingAnalytics');
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

console.log('[SW] Service Worker loaded successfully');
