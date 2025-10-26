# 🏗️ PWA Architecture Overview

Complete technical architecture of the Catalyst PWA implementation.

---

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                        │
│  (4 Dashboards: Student, Teacher, Admin, Parent)           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                   PWA COMPONENTS LAYER                       │
│  • PWAInstallPrompt    • PWAUpdateBanner                    │
│  • OfflineIndicator    • usePWA Hook                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                     API LAYER                                │
│                   OfflineAPI Wrapper                         │
│  ┌──────────────────────────────────────────────────┐      │
│  │  • fetchStudentDashboard()                       │      │
│  │  • fetchTeacherDashboard(teacherId)              │      │
│  │  • fetchAdminDashboard()                         │      │
│  │  • fetchParentDashboard()                        │      │
│  │  • submitForm(endpoint, data)                    │      │
│  │  • prefetchDashboards()                          │      │
│  └──────────────────────────────────────────────────┘      │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        ↓                               ↓
┌──────────────────┐          ┌──────────────────┐
│  SERVICE WORKER  │          │   SUPABASE PWA   │
│   (Caching)      │          │     CLIENT       │
│                  │          │                  │
│ • Cache-First    │          │ • Auth Storage   │
│ • Stale-While-   │          │ • Auto-Refresh   │
│   Revalidate     │          │ • Token Mgmt     │
│ • Background     │          │ • Offline Queue  │
│   Sync           │          │                  │
└────────┬─────────┘          └────────┬─────────┘
         │                             │
         ↓                             ↓
┌─────────────────────────────────────────────────────────────┐
│                    STORAGE LAYER                             │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐│
│  │ Cache Storage   │  │  IndexedDB   │  │ Session Storage││
│  │                 │  │              │  │                ││
│  │ • Static Assets │  │ • Dashboards │  │ • Quick Cache  ││
│  │ • API Responses │  │ • Auth       │  │ • Temp Data    ││
│  │ • Images        │  │ • Queue      │  │                ││
│  └─────────────────┘  └──────────────┘  └────────────────┘│
└─────────────────────────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                   SUPABASE BACKEND                           │
│  • PostgreSQL Database                                       │
│  • Row Level Security (RLS)                                  │
│  • Realtime Subscriptions                                    │
│  • Authentication Service                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Patterns

### **1. Dashboard Load (Online)**

```
User Opens Dashboard
        ↓
Check SessionStorage (5-min cache)
        ↓
    ┌───────┐
    │ HIT?  │
    └───┬───┘
        │
    ┌───┴───┐
    │ YES   │ NO
    ↓       ↓
Display  Fetch from OfflineAPI
Cache    ↓
Data     Check IndexedDB (PWA cache)
         ↓
     ┌───────┐
     │ HIT?  │
     └───┬───┘
         │
     ┌───┴───┐
     │ YES   │ NO
     ↓       ↓
  Display  Fetch from API
  Cache    ↓
  Data     Cache in IndexedDB
           ↓
           Service Worker intercepts
           ↓
           Cache API response
           ↓
           Return to user
           ↓
           Display + Cache in SessionStorage
```

### **2. Dashboard Load (Offline)**

```
User Opens Dashboard (Offline)
        ↓
Check SessionStorage
        ↓
    ┌───────┐
    │ HIT?  │
    └───┬───┘
        │
    ┌───┴───┐
    │ YES   │ NO
    ↓       ↓
Display  Check IndexedDB
Cache    ↓
Data     ┌───────┐
         │ HIT?  │
         └───┬───┘
             │
         ┌───┴───┐
         │ YES   │ NO
         ↓       ↓
      Display  Service Worker
      Cache    ↓
      Data     Check Cache Storage
               ↓
           ┌───────┐
           │ HIT?  │
           └───┬───┘
               │
           ┌───┴───┐
           │ YES   │ NO
           ↓       ↓
        Display  Show Offline
        Cache    Message
        Data
```

### **3. Form Submission (Offline)**

```
User Submits Form (Offline)
        ↓
OfflineAPI.submitForm()
        ↓
Add to OfflineQueue (IndexedDB)
        ↓
Return { success: true, offline: true }
        ↓
Show "Queued for sync" message
        ↓
User Goes Back Online
        ↓
Service Worker 'online' event
        ↓
Trigger Background Sync
        ↓
Process OfflineQueue items
        ↓
For each queued action:
  • Attempt to submit
  • If success: remove from queue
  • If fail: increment retry count
  • If max retries: remove from queue
        ↓
Notify user of sync status
```

---

## 🗄️ IndexedDB Schema

### **Database: CatalystPWA**

```typescript
Version: 1

Tables:
┌─────────────────────────────────────────────────────────┐
│ dashboards                                              │
├─────────────┬───────────────────────────────────────────┤
│ Field       │ Description                               │
├─────────────┼───────────────────────────────────────────┤
│ id          │ Auto-increment primary key                │
│ userId      │ User ID (indexed)                         │
│ dashboardType│ student|teacher|admin|parent (indexed)   │
│ data        │ Compressed JSON string                    │
│ timestamp   │ Cache timestamp (indexed)                 │
│ etag        │ Optional ETag for validation              │
└─────────────┴───────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ authSessions                                            │
├─────────────┬───────────────────────────────────────────┤
│ Field       │ Description                               │
├─────────────┼───────────────────────────────────────────┤
│ id          │ Auto-increment primary key                │
│ userId      │ User ID (indexed)                         │
│ accessToken │ Supabase access token                     │
│ refreshToken│ Supabase refresh token                    │
│ expiresAt   │ Token expiry timestamp (indexed)          │
│ user        │ User object                               │
│ timestamp   │ Created timestamp (indexed)               │
└─────────────┴───────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ offlineQueue                                            │
├─────────────┬───────────────────────────────────────────┤
│ Field       │ Description                               │
├─────────────┼───────────────────────────────────────────┤
│ id          │ Auto-increment primary key                │
│ url         │ API endpoint URL                          │
│ method      │ HTTP method (POST, PUT, DELETE)           │
│ headers     │ Request headers                           │
│ body        │ Request body                              │
│ timestamp   │ Queued timestamp (indexed)                │
│ retries     │ Retry attempt count                       │
│ status      │ pending|syncing|failed (indexed)          │
└─────────────┴───────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ preferences                                             │
├─────────────┬───────────────────────────────────────────┤
│ Field       │ Description                               │
├─────────────┼───────────────────────────────────────────┤
│ id          │ Auto-increment primary key                │
│ key         │ Preference key (indexed)                  │
│ value       │ Preference value (any type)               │
│ timestamp   │ Updated timestamp (indexed)               │
└─────────────┴───────────────────────────────────────────┘
```

---

## 🔐 Authentication Flow

### **Login → Session Persistence**

```
User Logs In
    ↓
Supabase.auth.signInWithPassword()
    ↓
Session Created { access_token, refresh_token, user }
    ↓
Custom Auth Storage (client-pwa.ts)
    ↓
Save to IndexedDB (authSessions table)
    ↓
Set expiresAt = now + 30 days
    ↓
User Closes Browser
    ↓
User Reopens (within 30 days)
    ↓
Custom Auth Storage.getItem()
    ↓
Retrieve from IndexedDB
    ↓
Check if expiresAt > now
    ↓
┌─────────┐
│ Valid?  │
└────┬────┘
     │
  ┌──┴──┐
  │ YES │ NO
  ↓     ↓
Return  Delete Session
Session ↓
↓       Request Re-login
Auto-refresh if token near expiry
```

### **Token Refresh Flow**

```
Access Token Near Expiry (< 1 hour)
    ↓
Supabase.auth.refreshSession({ refresh_token })
    ↓
New Session Created
    ↓
Update IndexedDB (authSessions)
    ↓
Continue Using App
```

---

## 🎯 Caching Strategy Matrix

| Resource Type | Strategy | TTL | Storage | Fallback |
|--------------|----------|-----|---------|----------|
| **HTML/CSS/JS** | Cache First | Until version change | Cache Storage | Network |
| **API Calls** | Stale-While-Revalidate | 5 min | IndexedDB + Cache | Offline Message |
| **Dashboard Data** | Memory + IndexedDB | 5 min | SessionStorage + IndexedDB | Cached Data |
| **Images** | Cache First | 7 days | Cache Storage | Placeholder |
| **Auth Tokens** | Memory + IndexedDB | 30 days | IndexedDB only | Re-login |
| **Offline Queue** | Persistent | Until synced | IndexedDB only | N/A |

---

## 🔄 Service Worker Lifecycle

```
Install Event
    ↓
Cache static assets (manifest, icons, offline.html)
    ↓
skipWaiting() - Activate immediately
    ↓
Activate Event
    ↓
Delete old cache versions
    ↓
clients.claim() - Take control of pages
    ↓
Ready to Intercept Requests
    ↓
Fetch Event
    ↓
┌─────────────────────────────────────┐
│ Request Type?                       │
└──┬──────────────┬──────────────┬───┘
   │              │              │
   ↓              ↓              ↓
API Request   Image Request  Static Asset
   │              │              │
   ↓              ↓              ↓
Stale-While-  Cache-First   Network-First
Revalidate
   │              │              │
   └──────────────┴──────────────┘
                  ↓
          Return Response
                  ↓
          Update Cache in Background
```

---

## 📊 Performance Optimization Points

### **1. Cache Layers (Fastest → Slowest)**

```
1. Memory (React State)           - <1ms
2. SessionStorage                 - 1-5ms
3. IndexedDB                      - 5-50ms
4. Service Worker Cache           - 10-100ms
5. Network (Cached Response)      - 50-200ms
6. Network (Fresh Response)       - 200-2000ms
```

### **2. Data Compression**

```typescript
// Before: 50KB JSON
{
  "students": [...1000 student objects...]
}

// After: 30KB compressed (40% reduction)
"{\"students\":[...]}"  // Whitespace removed
```

### **3. Parallel Loading**

```typescript
// Old: Sequential (4 seconds)
await fetch('/api/dashboard')      // 1s
await fetch('/api/school-info')    // 1s
await fetch('/api/announcements')  // 1s
await fetch('/api/polls')          // 1s

// New: Parallel (1 second)
await Promise.all([
  fetch('/api/dashboard'),
  fetch('/api/school-info'),
  fetch('/api/announcements'),
  fetch('/api/polls')
])
```

---

## 🧩 Component Integration Map

### **Dashboard → OfflineAPI → Storage**

```
Student Dashboard (page.tsx)
    ↓
OfflineAPI.fetchStudentDashboard()
    ↓
┌──────────────────────────────────┐
│ 1. Check SessionStorage (5 min)  │
│ 2. Check IndexedDB (PWA cache)   │
│ 3. Fetch from API                │
│ 4. Cache response                │
└──────────────────────────────────┘
    ↓
Service Worker Intercepts API Call
    ↓
┌──────────────────────────────────┐
│ 1. Check Cache Storage            │
│ 2. Serve cached if available     │
│ 3. Fetch fresh in background     │
│ 4. Update cache                  │
└──────────────────────────────────┘
    ↓
Return to Component
    ↓
Display to User
```

---

## 🛡️ Security Architecture

### **Client-Side (Public)**

```
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ Access Tokens (short-lived)
✅ Refresh Tokens (encrypted in IndexedDB)
```

### **Server-Side (Private)**

```
🔒 SUPABASE_SERVICE_ROLE_KEY
🔒 Database Connection Strings
🔒 API Secrets
🔒 Encryption Keys
```

### **Storage Security**

```
IndexedDB (Client)
├── Auth Tokens: Encrypted, 30-day expiry
├── Dashboard Data: Public data only
├── Offline Queue: User's own data
└── Preferences: Non-sensitive settings

Cache Storage (Client)
├── Static Assets: Public files
├── API Responses: Public data only
└── Images: Public images only
```

---

## 🔌 API Integration Points

### **Existing APIs Enhanced**

1. `/api/student/dashboard` → `OfflineAPI.fetchStudentDashboard()`
2. `/api/teacher/dashboard-combined` → `OfflineAPI.fetchTeacherDashboard()`
3. `/api/admin/dashboard` → `OfflineAPI.fetchAdminDashboard()`
4. `/api/v1/parents/dashboard` → `OfflineAPI.fetchParentDashboard()`

### **New PWA-Specific Functions**

```typescript
// Prefetch for offline
OfflineAPI.prefetchDashboards()

// Submit with offline queue
OfflineAPI.submitForm(endpoint, data)

// Clear all caches
OfflineAPI.clearCache()
```

---

## 📱 Platform Support Matrix

| Feature | Chrome | Safari | Edge | Firefox | Mobile |
|---------|--------|--------|------|---------|--------|
| Service Worker | ✅ | ✅ | ✅ | ✅ | ✅ |
| IndexedDB | ✅ | ✅ | ✅ | ✅ | ✅ |
| Install Prompt | ✅ | ⚠️* | ✅ | ❌ | ✅ |
| Background Sync | ✅ | ❌ | ✅ | ❌ | ⚠️ |
| Push Notifications | ✅ | ⚠️** | ✅ | ✅ | ⚠️ |
| Offline Mode | ✅ | ✅ | ✅ | ✅ | ✅ |

*iOS: Add to Home Screen manually  
**iOS 16.4+: Web Push supported

---

## 🎯 Key Metrics & Monitoring

### **Performance Metrics**

```typescript
// Cache Hit Rate
const hitRate = cacheHits / (cacheHits + cacheMisses) * 100
// Target: >80%

// Average Load Time
const avgLoadTime = totalLoadTime / pageViews
// Target: <500ms (from cache)

// IndexedDB Query Time
const avgQueryTime = totalQueryTime / queryCount
// Target: <50ms
```

### **PWA Health Checks**

```javascript
// Service Worker Status
navigator.serviceWorker.ready.then(reg => {
  console.log('SW Ready:', reg.active.state) // 'activated'
})

// Storage Usage
navigator.storage.estimate().then(estimate => {
  const usage = (estimate.usage / estimate.quota * 100).toFixed(2)
  console.log('Storage Used:', usage + '%') // Target: <50%
})

// Cache Status
caches.keys().then(names => {
  console.log('Active Caches:', names.length) // Should have 3: static, api, images
})
```

---

## 🚀 Deployment Architecture

### **Development**
```
Local Machine
    ↓
http://localhost:3000
    ↓
Service Worker (dev mode)
    ↓
Local Supabase Project
```

### **Production**
```
User Device
    ↓
https://your-domain.com (HTTPS required)
    ↓
CDN (Netlify/Vercel)
    ↓
Service Worker (production)
    ↓
IndexedDB (local storage)
    ↓
Supabase Production (cloud)
```

---

## 📚 File Structure

```
catalyst/
├── public/
│   ├── manifest.json              # PWA manifest
│   ├── service-worker.js          # Service worker
│   ├── offline.html               # Offline page
│   ├── icon-512x512.png           # App icon (large)
│   ├── icon-192x192.png           # App icon (small)
│   └── apple-touch-icon.png       # iOS icon
│
├── src/
│   ├── app/
│   │   ├── layout.tsx             # PWA meta tags + components
│   │   └── (dashboard)/
│   │       ├── student/page.tsx   # Uses OfflineAPI
│   │       ├── teacher/page.tsx   # Uses OfflineAPI
│   │       ├── admin/page.tsx     # Uses OfflineAPI
│   │       └── parent/page.tsx    # Uses OfflineAPI
│   │
│   ├── components/
│   │   └── ui/
│   │       └── pwa-install-prompt.tsx  # Install UI
│   │
│   ├── hooks/
│   │   ├── usePWA.ts              # PWA hook
│   │   └── useTeacherDashboard.ts # Enhanced with OfflineAPI
│   │
│   └── lib/
│       ├── api/
│       │   └── offline-wrapper.ts # API wrapper
│       ├── db/
│       │   └── indexeddb.ts       # IndexedDB utils
│       └── supabase/
│           └── client-pwa.ts      # Enhanced client
│
├── PWA_IMPLEMENTATION_GUIDE.md
├── PWA_DEPLOYMENT_CHECKLIST.md
├── PWA_QUICK_START.md
├── PWA_FINAL_SUMMARY.md
└── PWA_ARCHITECTURE.md (this file)
```

---

**Version:** 1.0.0  
**Last Updated:** 2025-10-20  
**Status:** Production Ready ✅
