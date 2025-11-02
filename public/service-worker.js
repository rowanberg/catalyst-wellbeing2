/**
 * Service Worker for Catalyst PWA
 * Implements caching strategies, offline support, and background sync
 */

const CACHE_VERSION = 'catalyst-v1.0.2';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// API endpoints to cache with stale-while-revalidate
const API_ENDPOINTS = [
  '/api/student/dashboard',
  '/api/teacher/data',
  '/api/admin/dashboard',
  '/api/parent/dashboard',
  '/api/profile',
  '/api/get-profile',
  '/api/student/school-info',
  '/api/auth/session'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.error('[SW] Failed to cache some static assets:', err);
      });
    })
  );
  
  // Force the service worker to activate immediately
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName.startsWith('catalyst-') && 
                   cacheName !== STATIC_CACHE &&
                   cacheName !== API_CACHE &&
                   cacheName !== IMAGE_CACHE;
          })
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Skip auth, session, registration, teacher, admin, and v1 API endpoints - let them go directly to network
  // CRITICAL: v1 APIs should NOT be cached to prevent offline errors
  if (url.pathname.startsWith('/api/auth/') || 
      url.pathname.startsWith('/api/v1/') ||
      url.pathname.startsWith('/api/verify-student') ||
      url.pathname.startsWith('/api/create-profile') ||
      url.pathname.startsWith('/api/fix-orphaned-student') ||
      url.pathname.startsWith('/api/register') ||
      url.pathname.startsWith('/api/reset-password') ||
      url.pathname.startsWith('/api/teacher/') ||
      url.pathname.startsWith('/api/admin/wellbeing') ||
      url.pathname.startsWith('/api/admin/ai-chat')) {
    return; // Let browser handle these directly - no caching
  }
  
  // API requests - stale-while-revalidate strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Image requests - cache first
  if (request.destination === 'image' || 
      /\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(url.pathname)) {
    event.respondWith(handleImageRequest(request));
    return;
  }
  
  // Static assets and navigation - network first with cache fallback
  event.respondWith(handleStaticRequest(request));
});

/**
 * Handle API requests with stale-while-revalidate strategy
 * Serves cached data immediately, then fetches fresh data in background
 */
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Create a fetch promise for fresh data
  const fetchPromise = fetch(request)
    .then(async (response) => {
      // Only cache successful responses
      if (response && response.ok) {
        const responseToCache = response.clone();
        const cache = await caches.open(API_CACHE);
        await cache.put(request, responseToCache);
        
        // Notify clients of fresh data
        notifyClients('api-updated', {
          url: request.url,
          timestamp: Date.now()
        });
      }
      return response;
    })
    .catch((error) => {
      console.error('[SW] API fetch failed:', error);
      // Return cached response if fetch fails
      if (cachedResponse) {
        return cachedResponse;
      }
      // Return error response if no cache
      return new Response(
        JSON.stringify({ 
          error: 'Offline', 
          message: 'No cached data available' 
        }),
        { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    });
  
  // Return cached response immediately if available
  if (cachedResponse) {
    // Also fetch fresh data in background
    fetchPromise.then(() => {
      console.log('[SW] Background update completed for:', request.url);
    });
    return cachedResponse;
  }
  
  // Wait for network if no cache
  return fetchPromise;
}

/**
 * Handle image requests with cache-first strategy
 */
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const responseToCache = response.clone();
      cache.put(request, responseToCache);
    }
    return response;
  } catch (error) {
    console.error('[SW] Image fetch failed:', error);
    // Return placeholder image if available
    return cache.match('/placeholder.png') || new Response('', { status: 404 });
  }
}

/**
 * Handle static assets and navigation with network-first strategy
 */
async function handleStaticRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    
    if (response && response.ok) {
      // Cache successful responses
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Fall back to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // For navigation requests, return offline page
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/offline.html');
      if (offlinePage) {
        return offlinePage;
      }
    }
    
    // Return error response
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Background sync for offline actions
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData());
  }
});

/**
 * Sync offline data when connection is restored
 */
async function syncOfflineData() {
  try {
    // Get offline queue from IndexedDB
    const db = await openDB();
    const tx = db.transaction('offline_queue', 'readonly');
    const store = tx.objectStore('offline_queue');
    const queue = await store.getAll();
    
    console.log(`[SW] Syncing ${queue.length} offline actions`);
    
    for (const action of queue) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });
        
        if (response.ok) {
          // Remove from queue on success
          const deleteTx = db.transaction('offline_queue', 'readwrite');
          await deleteTx.objectStore('offline_queue').delete(action.id);
          
          // Notify client of successful sync
          notifyClients('sync-success', {
            action: action,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.error('[SW] Failed to sync action:', action, error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

/**
 * Open IndexedDB connection
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CatalystPWA', 1);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create offline queue store if it doesn't exist
      if (!db.objectStoreNames.contains('offline_queue')) {
        db.createObjectStore('offline_queue', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

/**
 * Notify all clients of an event
 */
async function notifyClients(type, data) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: type,
      data: data
    });
  });
}

/**
 * Periodic cache cleanup (runs every 7 days)
 */
setInterval(async () => {
  const caches_list = await caches.keys();
  const now = Date.now();
  const WEEK = 7 * 24 * 60 * 60 * 1000;
  
  for (const cache_name of caches_list) {
    if (cache_name.includes('api-')) {
      const cache = await caches.open(cache_name);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        const dateHeader = response.headers.get('date');
        
        if (dateHeader) {
          const responseDate = new Date(dateHeader).getTime();
          if (now - responseDate > WEEK) {
            console.log('[SW] Removing stale cache entry:', request.url);
            await cache.delete(request);
          }
        }
      }
    }
  }
}, 24 * 60 * 60 * 1000); // Run daily

console.log('[SW] Service worker loaded');
