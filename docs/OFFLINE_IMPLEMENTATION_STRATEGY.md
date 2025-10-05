# Offline Implementation Strategy for Student Dashboard
**Catalyst Platform - Progressive Web App (PWA) Enhancement**

Generated on: 2025-10-05T11:15:39+05:30
Framework: Next.js 15.5.2 with Service Worker Integration

---

## Executive Summary

Based on the comprehensive codebase analysis, the student dashboard currently relies heavily on real-time API calls and client-side state management. This strategy outlines a phased approach to implement offline functionality that allows students to access their dashboard with cached data when internet is unavailable.

## Current Architecture Analysis

### Data Flow Patterns Identified

**1. Authentication & Profile Data:**
- Redux store manages user authentication state
- Profile data fetched via `/api/get-profile`
- Session management through Supabase Auth
- Real-time role-based routing

**2. Dashboard Data Dependencies:**
```typescript
// Key API endpoints identified:
/api/student/dashboard-data    // Core dashboard metrics
/api/student/mood              // Daily mood tracking
/api/student/school-info       // School contact information
/api/student/announcements     // School announcements
/api/student/results          // Academic results
/api/student/wallet/*         // Wallet functionality
/api/student/habits           // Habit tracking
/api/student/gratitude        // Gratitude entries
/api/student/kindness         // Kindness activities
/api/student/courage          // Courage log
/api/student/affirmations     // Daily affirmations
/api/student/breathing        // Breathing exercises
```

**3. Real-time Features:**
- Messaging system with live updates
- Wallet transactions
- XP and gems progression
- Achievement notifications

**4. Local Storage Usage:**
- Study plans already cached locally
- Theme preferences stored
- Font size settings

---

## Offline Implementation Strategy

### Phase 1: Service Worker & Cache Setup (Priority 1)

#### 1.1 Service Worker Implementation

**Create:** `public/sw.js`
```javascript
const CACHE_NAME = 'catalyst-student-v1.0'
const OFFLINE_URL = '/offline'

// Critical resources for offline functionality
const STATIC_RESOURCES = [
  '/',
  '/student',
  '/student/wallet',
  '/student/habits',
  '/student/gratitude',
  '/offline',
  // CSS and JS bundles (auto-populated during build)
]

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /^\/api\/student\/dashboard-data/,
  /^\/api\/student\/school-info/,
  /^\/api\/student\/announcements/,
  /^\/api\/student\/profile/,
  /^\/api\/get-profile/
]

// Install event - cache critical resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_RESOURCES))
      .then(() => self.skipWaiting())
  )
})

// Fetch event - implement cache strategies
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)
  
  // Handle API requests
  if (url.pathname.startsWith('/api/student/')) {
    event.respondWith(handleAPIRequest(event.request))
    return
  }
  
  // Handle page requests
  if (url.pathname.startsWith('/student')) {
    event.respondWith(handlePageRequest(event.request))
    return
  }
})

// Cache-first strategy for API data
async function handleAPIRequest(request) {
  const cache = await caches.open(CACHE_NAME)
  const cachedResponse = await cache.match(request)
  
  // Return cached version immediately if available
  if (cachedResponse) {
    // Try to update cache in background
    updateCacheInBackground(request, cache)
    return cachedResponse
  }
  
  // Fallback to network
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    // Return offline fallback data
    return createOfflineFallback(request)
  }
}

// Network-first strategy for pages
async function handlePageRequest(request) {
  try {
    const networkResponse = await fetch(request)
    return networkResponse
  } catch (error) {
    const cache = await caches.open(CACHE_NAME)
    const cachedResponse = await cache.match(request)
    return cachedResponse || await cache.match('/offline')
  }
}
```

#### 1.2 Next.js PWA Configuration

**Update:** `next.config.js`
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 365 days
        }
      }
    },
    {
      urlPattern: /^\/api\/student\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'student-api',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        }
      }
    }
  ]
})

module.exports = withPWA({
  // existing config
})
```

#### 1.3 Web App Manifest

**Create:** `public/manifest.json`
```json
{
  "name": "Catalyst Student Dashboard",
  "short_name": "Catalyst",
  "description": "Educational platform for students",
  "start_url": "/student",
  "display": "standalone",
  "background_color": "#1a1f3a",
  "theme_color": "#6366f1",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ]
}
```

### Phase 2: Offline Data Management (Priority 2)

#### 2.1 Enhanced Local Storage Manager

**Create:** `src/lib/offline/localStorageManager.ts`
```typescript
interface CachedData {
  data: any
  timestamp: number
  expiresAt: number
}

export class OfflineStorageManager {
  private static readonly STORAGE_PREFIX = 'catalyst_offline_'
  
  // Cache duration in milliseconds
  private static readonly CACHE_DURATIONS = {
    profile: 24 * 60 * 60 * 1000,        // 24 hours
    dashboard: 4 * 60 * 60 * 1000,       // 4 hours
    announcements: 2 * 60 * 60 * 1000,   // 2 hours
    schoolInfo: 24 * 60 * 60 * 1000,     // 24 hours
    habits: 1 * 60 * 60 * 1000,          // 1 hour
    results: 24 * 60 * 60 * 1000,        // 24 hours
  }

  static set<T>(key: string, data: T, customDuration?: number): void {
    const duration = customDuration || this.CACHE_DURATIONS[key as keyof typeof this.CACHE_DURATIONS] || 60 * 60 * 1000
    
    const cachedData: CachedData = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + duration
    }
    
    try {
      localStorage.setItem(
        this.STORAGE_PREFIX + key, 
        JSON.stringify(cachedData)
      )
    } catch (error) {
      console.warn('Failed to cache data:', key, error)
      this.clearOldestCache()
    }
  }

  static get<T>(key: string): T | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_PREFIX + key)
      if (!stored) return null

      const cachedData: CachedData = JSON.parse(stored)
      
      // Check if expired
      if (Date.now() > cachedData.expiresAt) {
        this.remove(key)
        return null
      }
      
      return cachedData.data as T
    } catch (error) {
      console.warn('Failed to retrieve cached data:', key, error)
      return null
    }
  }

  static isExpired(key: string): boolean {
    try {
      const stored = localStorage.getItem(this.STORAGE_PREFIX + key)
      if (!stored) return true

      const cachedData: CachedData = JSON.parse(stored)
      return Date.now() > cachedData.expiresAt
    } catch {
      return true
    }
  }

  static remove(key: string): void {
    localStorage.removeItem(this.STORAGE_PREFIX + key)
  }

  static clearAll(): void {
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.STORAGE_PREFIX))
      .forEach(key => localStorage.removeItem(key))
  }

  static getStorageSize(): number {
    let total = 0
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.STORAGE_PREFIX))
      .forEach(key => {
        total += (localStorage.getItem(key) || '').length
      })
    return total
  }

  private static clearOldestCache(): void {
    const keys = Object.keys(localStorage)
      .filter(key => key.startsWith(this.STORAGE_PREFIX))
    
    if (keys.length === 0) return

    // Find oldest cache entry
    let oldestKey = keys[0]
    let oldestTime = Infinity

    keys.forEach(key => {
      try {
        const cached: CachedData = JSON.parse(localStorage.getItem(key) || '{}')
        if (cached.timestamp < oldestTime) {
          oldestTime = cached.timestamp
          oldestKey = key
        }
      } catch {}
    })

    localStorage.removeItem(oldestKey)
  }
}
```

#### 2.2 Offline-Aware API Hook

**Create:** `src/hooks/useOfflineAPI.ts`
```typescript
import { useState, useEffect, useCallback } from 'react'
import { OfflineStorageManager } from '@/lib/offline/localStorageManager'

interface UseOfflineAPIOptions {
  cacheKey: string
  cacheDuration?: number
  backgroundUpdate?: boolean
}

export function useOfflineAPI<T>(
  apiCall: () => Promise<T>,
  options: UseOfflineAPIOptions
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    setIsOffline(!navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)

      // Try to get cached data first
      if (!forceRefresh) {
        const cachedData = OfflineStorageManager.get<T>(options.cacheKey)
        if (cachedData) {
          setData(cachedData)
          setLoading(false)
          
          // Background update if enabled and online
          if (options.backgroundUpdate && navigator.onLine) {
            apiCall().then(freshData => {
              OfflineStorageManager.set(options.cacheKey, freshData, options.cacheDuration)
              setData(freshData)
            }).catch(() => {}) // Silently fail background updates
          }
          return cachedData
        }
      }

      // Fetch fresh data
      const freshData = await apiCall()
      OfflineStorageManager.set(options.cacheKey, freshData, options.cacheDuration)
      setData(freshData)
      return freshData
      
    } catch (err) {
      // Try cached data as fallback
      const cachedData = OfflineStorageManager.get<T>(options.cacheKey)
      if (cachedData) {
        setData(cachedData)
        setError('Using cached data (offline)')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      }
    } finally {
      setLoading(false)
    }
  }, [apiCall, options.cacheKey, options.cacheDuration, options.backgroundUpdate])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    isOffline,
    refetch: () => fetchData(true),
    isStale: OfflineStorageManager.isExpired(options.cacheKey)
  }
}
```

### Phase 3: Component-Level Offline Integration (Priority 2)

#### 3.1 Enhanced Student Dashboard with Offline Support

**Update:** `src/app/(dashboard)/student/page.tsx`
```typescript
'use client'

import React, { useState, useEffect, useCallback } from 'react'
// ... existing imports
import { useOfflineAPI } from '@/hooks/useOfflineAPI'
import { OfflineStorageManager } from '@/lib/offline/localStorageManager'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'

// Offline banner component
const OfflineBanner = ({ isOffline, onRefresh }: { 
  isOffline: boolean
  onRefresh: () => void 
}) => {
  if (!isOffline) return null
  
  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-900 p-3 text-center"
    >
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm font-medium">You're offline - showing cached data</span>
        <button
          onClick={onRefresh}
          className="ml-2 px-2 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 transition-colors"
        >
          <RefreshCw className="h-3 w-3 inline mr-1" />
          Retry
        </button>
      </div>
    </motion.div>
  )
}

function StudentDashboardContent() {
  // ... existing state

  // Offline-aware API calls
  const {
    data: dashboardData,
    loading: dashboardLoading,
    error: dashboardError,
    isOffline,
    refetch: refetchDashboard,
    isStale: isDashboardStale
  } = useOfflineAPI(
    () => fetch('/api/student/dashboard-data').then(res => res.json()),
    { 
      cacheKey: 'dashboard',
      backgroundUpdate: true,
      cacheDuration: 4 * 60 * 60 * 1000 // 4 hours
    }
  )

  const {
    data: schoolInfo,
    loading: schoolLoading
  } = useOfflineAPI(
    () => fetch('/api/student/school-info').then(res => res.json()),
    { 
      cacheKey: 'schoolInfo',
      backgroundUpdate: true 
    }
  )

  const {
    data: announcements,
    loading: announcementsLoading
  } = useOfflineAPI(
    () => fetch('/api/student/announcements').then(res => res.json()),
    { 
      cacheKey: 'announcements',
      backgroundUpdate: true,
      cacheDuration: 2 * 60 * 60 * 1000 // 2 hours
    }
  )

  // Offline state management for mood tracking
  const [offlineMoodEntries, setOfflineMoodEntries] = useState<any[]>([])

  const handleOfflineMoodSubmit = useCallback((moodData: any) => {
    const entry = {
      ...moodData,
      id: `offline_${Date.now()}`,
      timestamp: new Date().toISOString(),
      synced: false
    }
    
    const entries = OfflineStorageManager.get<any[]>('offlineMoodEntries') || []
    entries.push(entry)
    OfflineStorageManager.set('offlineMoodEntries', entries)
    setOfflineMoodEntries(entries)
    
    // Show success message
    toast.success('Mood saved offline - will sync when online')
  }, [])

  // Sync offline data when back online
  useEffect(() => {
    const syncOfflineData = async () => {
      if (!navigator.onLine) return

      const entries = OfflineStorageManager.get<any[]>('offlineMoodEntries') || []
      const unsynced = entries.filter(entry => !entry.synced)
      
      if (unsynced.length === 0) return

      try {
        for (const entry of unsynced) {
          await fetch('/api/student/mood', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry)
          })
          
          // Mark as synced
          entry.synced = true
        }
        
        OfflineStorageManager.set('offlineMoodEntries', entries)
        setOfflineMoodEntries(entries)
        toast.success(`Synced ${unsynced.length} offline entries`)
      } catch (error) {
        console.error('Failed to sync offline data:', error)
      }
    }

    window.addEventListener('online', syncOfflineData)
    return () => window.removeEventListener('online', syncOfflineData)
  }, [])

  return (
    <div className="min-h-screen relative">
      {/* Offline Banner */}
      <OfflineBanner 
        isOffline={isOffline} 
        onRefresh={refetchDashboard} 
      />
      
      {/* Stale Data Indicator */}
      {isDashboardStale && !isOffline && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-blue-600">
            <RefreshCw className="h-4 w-4" />
            <span className="text-sm">Data may be outdated</span>
            <button
              onClick={refetchDashboard}
              className="ml-auto text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
            >
              Refresh
            </button>
          </div>
        </div>
      )}

      {/* Rest of existing dashboard content */}
      {/* ... existing JSX with offline-aware data usage */}
    </div>
  )
}
```

### Phase 4: Advanced Offline Features (Priority 3)

#### 4.1 Offline Queue Management

**Create:** `src/lib/offline/syncQueue.ts`
```typescript
interface QueuedAction {
  id: string
  type: string
  data: any
  timestamp: number
  retries: number
  maxRetries: number
}

export class OfflineSyncQueue {
  private static readonly QUEUE_KEY = 'catalyst_sync_queue'
  private static readonly MAX_RETRIES = 3

  static add(type: string, data: any, maxRetries = this.MAX_RETRIES): void {
    const queue = this.getQueue()
    const action: QueuedAction = {
      id: `${type}_${Date.now()}_${Math.random()}`,
      type,
      data,
      timestamp: Date.now(),
      retries: 0,
      maxRetries
    }
    
    queue.push(action)
    this.saveQueue(queue)
  }

  static async processQueue(): Promise<void> {
    if (!navigator.onLine) return
    
    const queue = this.getQueue()
    const processed: string[] = []
    
    for (const action of queue) {
      try {
        await this.processAction(action)
        processed.push(action.id)
      } catch (error) {
        action.retries++
        if (action.retries >= action.maxRetries) {
          processed.push(action.id) // Remove failed actions
          console.error('Max retries reached for action:', action.type, error)
        }
      }
    }
    
    // Remove processed actions
    const remainingQueue = queue.filter(action => !processed.includes(action.id))
    this.saveQueue(remainingQueue)
  }

  private static async processAction(action: QueuedAction): Promise<void> {
    const endpoints: Record<string, string> = {
      'mood': '/api/student/mood',
      'habit': '/api/student/habits',
      'gratitude': '/api/student/gratitude',
      'kindness': '/api/student/kindness',
      'courage': '/api/student/courage'
    }
    
    const endpoint = endpoints[action.type]
    if (!endpoint) throw new Error(`Unknown action type: ${action.type}`)
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action.data)
    })
    
    if (!response.ok) {
      throw new Error(`Failed to sync ${action.type}: ${response.statusText}`)
    }
  }

  private static getQueue(): QueuedAction[] {
    try {
      const stored = localStorage.getItem(this.QUEUE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  private static saveQueue(queue: QueuedAction[]): void {
    try {
      localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue))
    } catch (error) {
      console.error('Failed to save sync queue:', error)
    }
  }

  static getQueueSize(): number {
    return this.getQueue().length
  }

  static clearQueue(): void {
    localStorage.removeItem(this.QUEUE_KEY)
  }
}
```

#### 4.2 Offline Status Component

**Create:** `src/components/offline/OfflineStatus.tsx`
```typescript
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wifi, WifiOff, Cloud, CloudOff, Sync } from 'lucide-react'
import { OfflineSyncQueue } from '@/lib/offline/syncQueue'

export function OfflineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [queueSize, setQueueSize] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      syncOfflineData()
    }
    
    const handleOffline = () => setIsOnline(false)
    
    const updateQueueSize = () => {
      setQueueSize(OfflineSyncQueue.getQueueSize())
    }

    const syncOfflineData = async () => {
      if (OfflineSyncQueue.getQueueSize() > 0) {
        setIsSyncing(true)
        try {
          await OfflineSyncQueue.processQueue()
        } finally {
          setIsSyncing(false)
          updateQueueSize()
        }
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Check initial state
    setIsOnline(navigator.onLine)
    updateQueueSize()
    
    // Update queue size periodically
    const interval = setInterval(updateQueueSize, 5000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  if (isOnline && queueSize === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <div className={`
        flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium shadow-lg
        ${isOnline 
          ? 'bg-green-500 text-white' 
          : 'bg-red-500 text-white'
        }
      `}>
        {isSyncing ? (
          <Sync className="h-4 w-4 animate-spin" />
        ) : isOnline ? (
          <Wifi className="h-4 w-4" />
        ) : (
          <WifiOff className="h-4 w-4" />
        )}
        
        <span>
          {isSyncing 
            ? 'Syncing...'
            : isOnline 
              ? queueSize > 0 
                ? `${queueSize} pending`
                : 'Online'
              : 'Offline'
          }
        </span>
      </div>
    </motion.div>
  )
}
```

### Phase 5: Testing & Optimization (Priority 3)

#### 5.1 Offline Testing Utilities

**Create:** `src/lib/offline/testUtils.ts`
```typescript
export class OfflineTestUtils {
  static simulateOffline(): void {
    if ('serviceWorker' in navigator) {
      // Dispatch offline event
      window.dispatchEvent(new Event('offline'))
    }
    console.log('🔴 Offline mode simulated')
  }

  static simulateOnline(): void {
    if ('serviceWorker' in navigator) {
      // Dispatch online event
      window.dispatchEvent(new Event('online'))
    }
    console.log('🟢 Online mode simulated')
  }

  static clearAllCache(): Promise<void> {
    return caches.keys().then(names => 
      Promise.all(names.map(name => caches.delete(name)))
    )
  }

  static getCacheSize(): Promise<number> {
    return caches.keys().then(async names => {
      let total = 0
      for (const name of names) {
        const cache = await caches.open(name)
        const keys = await cache.keys()
        total += keys.length
      }
      return total
    })
  }
}
```

## Implementation Checklist

### Phase 1: Foundation (Week 1-2)
- [ ] Install and configure next-pwa
- [ ] Create service worker with basic caching
- [ ] Set up web app manifest
- [ ] Add offline page
- [ ] Implement OfflineStorageManager
- [ ] Create useOfflineAPI hook

### Phase 2: Core Integration (Week 3-4)
- [ ] Update student dashboard with offline support
- [ ] Implement offline-aware data fetching
- [ ] Add offline banner and status indicators
- [ ] Cache critical API endpoints
- [ ] Test offline functionality

### Phase 3: Advanced Features (Week 5-6)
- [ ] Implement sync queue for offline actions
- [ ] Add background sync for data updates
- [ ] Create offline status component
- [ ] Implement conflict resolution
- [ ] Add push notifications

### Phase 4: Testing & Polish (Week 7-8)
- [ ] Comprehensive offline testing
- [ ] Performance optimization
- [ ] User experience improvements
- [ ] Documentation and training
- [ ] Production deployment

## Expected Benefits

### Performance Improvements
- **Faster Load Times**: Cached resources load instantly
- **Reduced API Calls**: Background updates minimize requests
- **Better UX**: Smooth transitions between online/offline states

### Educational Continuity
- **Always Available**: Students can access dashboard without internet
- **Progress Tracking**: Mood, habits, and activities work offline
- **Study Materials**: Cached content for learning activities

### Technical Advantages
- **Progressive Enhancement**: Works on all devices and connections
- **Bandwidth Savings**: Reduced data usage for students
- **Server Load Reduction**: Fewer repeated API calls
- **Resilient Architecture**: Graceful degradation during outages

## Monitoring & Analytics

### Offline Usage Metrics
- Cache hit rates by endpoint
- Offline session duration
- Sync queue success rates
- User engagement during offline periods

### Performance Tracking
- Load times (online vs offline)
- Cache storage usage
- Battery impact assessment
- Network usage optimization

---

## Conclusion

This comprehensive offline strategy transforms the Catalyst student dashboard into a resilient, always-available educational platform. By implementing progressive caching, intelligent sync mechanisms, and offline-first design patterns, students will have uninterrupted access to their learning environment regardless of connectivity.

The phased approach ensures minimal disruption to current functionality while gradually building robust offline capabilities that enhance the overall user experience and educational outcomes.

---

*Implementation Strategy Document*  
*Generated: 2025-10-05T11:15:39+05:30*  
*Next Review: After Phase 1 completion*
