// Service Worker for Catalyst Parent Portal PWA
const CACHE_NAME = 'catalyst-parent-v1.0.0'
const STATIC_CACHE = 'catalyst-static-v1.0.0'
const API_CACHE = 'catalyst-api-v1.0.0'

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/parent',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Add critical CSS and JS files
]

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/v1/parents/dashboard',
  '/api/v1/parents/wellbeing',
  '/api/v1/parents/settings',
  '/api/v1/parents/community-feed',
]

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker')
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      }),
      caches.open(API_CACHE).then((cache) => {
        console.log('[SW] API cache initialized')
        return Promise.resolve()
      })
    ])
  )
  
  // Force activation of new service worker
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== STATIC_CACHE && 
              cacheName !== API_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  
  // Take control of all clients
  self.clients.claim()
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) {
    return
  }
  
  event.respondWith(handleRequest(request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  try {
    // API requests - Network First with fallback
    if (url.pathname.startsWith('/api/')) {
      return await handleAPIRequest(request)
    }
    
    // Static assets - Cache First
    if (isStaticAsset(url.pathname)) {
      return await handleStaticRequest(request)
    }
    
    // Navigation requests - Network First with offline fallback
    if (request.mode === 'navigate') {
      return await handleNavigationRequest(request)
    }
    
    // Default - Network First
    return await networkFirst(request, CACHE_NAME)
    
  } catch (error) {
    console.error('[SW] Request failed:', error)
    return await handleOfflineRequest(request)
  }
}

// Handle API requests with intelligent caching
async function handleAPIRequest(request) {
  const url = new URL(request.url)
  
  // Critical data - Stale While Revalidate
  if (isCriticalAPI(url.pathname)) {
    return await staleWhileRevalidate(request, API_CACHE)
  }
  
  // Regular API - Network First with 5 second timeout
  try {
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network timeout')), 5000)
      )
    ])
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(API_CACHE)
      cache.put(request, networkResponse.clone())
      return networkResponse
    }
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error)
  }
  
  // Fallback to cache
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  // Return offline response
  return createOfflineAPIResponse(request)
}

// Handle static assets
async function handleStaticRequest(request) {
  return await cacheFirst(request, STATIC_CACHE)
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      return networkResponse
    }
  } catch (error) {
    console.log('[SW] Navigation network failed:', error)
  }
  
  // Fallback to cached page or offline page
  const cachedResponse = await caches.match('/parent')
  if (cachedResponse) {
    return cachedResponse
  }
  
  // Return minimal offline page
  return new Response(createOfflinePage(), {
    headers: { 'Content-Type': 'text/html' }
  })
}

// Cache strategies implementation
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  const networkResponse = await fetch(request)
  if (networkResponse.ok) {
    const cache = await caches.open(cacheName)
    cache.put(request, networkResponse.clone())
  }
  
  return networkResponse
}

async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
      return networkResponse
    }
  } catch (error) {
    console.log('[SW] Network first failed:', error)
  }
  
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  throw new Error('No network or cache available')
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)
  
  // Always try to update in background
  const networkResponsePromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  }).catch(() => null)
  
  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse
  }
  
  // Wait for network if no cache
  return await networkResponsePromise || createOfflineAPIResponse(request)
}

// Utility functions
function isStaticAsset(pathname) {
  return pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/) ||
         pathname === '/manifest.json' ||
         pathname === '/favicon.ico'
}

function isCriticalAPI(pathname) {
  return pathname.includes('/dashboard') ||
         pathname.includes('/wellbeing') ||
         pathname.includes('/settings')
}

async function handleOfflineRequest(request) {
  const url = new URL(request.url)
  
  if (url.pathname.startsWith('/api/')) {
    return createOfflineAPIResponse(request)
  }
  
  if (request.mode === 'navigate') {
    const cachedPage = await caches.match('/parent')
    return cachedPage || new Response(createOfflinePage(), {
      headers: { 'Content-Type': 'text/html' }
    })
  }
  
  return new Response('Offline', { status: 503 })
}

function createOfflineAPIResponse(request) {
  const url = new URL(request.url)
  
  // Return appropriate offline responses based on endpoint
  if (url.pathname.includes('/dashboard')) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Offline mode - dashboard data unavailable',
      offline: true,
      data: {
        actionCenter: [],
        growthMetrics: null,
        upcomingAssignments: [],
        timeline: []
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  if (url.pathname.includes('/wellbeing')) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Offline mode - wellbeing data unavailable',
      offline: true,
      data: { analytics: [] }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  return new Response(JSON.stringify({
    success: false,
    error: 'Offline mode - data unavailable',
    offline: true
  }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  })
}

function createOfflinePage() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Catalyst - Offline</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
          padding: 20px;
        }
        .offline-container {
          max-width: 400px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 40px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
        h1 {
          margin: 0 0 16px 0;
          font-size: 24px;
          font-weight: 600;
        }
        p {
          margin: 0 0 24px 0;
          opacity: 0.9;
          line-height: 1.5;
        }
        .retry-btn {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .retry-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="icon">📱</div>
        <h1>You're Offline</h1>
        <p>Please check your internet connection and try again. Some cached content may still be available.</p>
        <button class="retry-btn" onclick="window.location.reload()">
          Try Again
        </button>
      </div>
    </body>
    </html>
  `
}

// Background sync for when connection returns
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(syncData())
  }
})

async function syncData() {
  console.log('[SW] Syncing data in background')
  
  try {
    // Sync critical data when connection returns
    const criticalEndpoints = [
      '/api/v1/parents/dashboard',
      '/api/v1/parents/settings'
    ]
    
    await Promise.all(
      criticalEndpoints.map(endpoint => 
        fetch(endpoint).then(response => {
          if (response.ok) {
            const cache = caches.open(API_CACHE)
            cache.then(c => c.put(endpoint, response.clone()))
          }
        }).catch(() => {})
      )
    )
    
    console.log('[SW] Background sync completed')
  } catch (error) {
    console.error('[SW] Background sync failed:', error)
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received')
  
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('Catalyst Parent Portal', options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action)
  
  event.notification.close()
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/parent')
    )
  }
})

console.log('[SW] Service worker loaded successfully')
