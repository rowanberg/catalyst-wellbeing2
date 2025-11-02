# 🚨 Critical Application Errors - Parent Dashboard

## Error Summary

| Error | Severity | Impact | Status |
|-------|----------|--------|--------|
| ERR_TOO_MANY_REDIRECTS | 🔴 CRITICAL | Auth completely broken | Investigating |
| 503 on parent APIs | 🔴 CRITICAL | Parent dashboard unusable | Service Worker issue |
| Multiple GoTrueClient instances | 🟡 WARNING | Memory leak potential | Needs fix |
| Service Worker fetch failures | 🔴 CRITICAL | Offline mode broken | Config issue |

---

## Error #1: ERR_TOO_MANY_REDIRECTS 🔴

### Symptoms
```
api/auth/session:1  Failed to load resource: net::ERR_TOO_MANY_REDIRECTS
Auth initialization error: TypeError: Failed to fetch
```

### Analysis

**Redirect Loop Chain:**
```
Browser → /api/auth/session 
  ↓
Middleware intercepts (applies headers)
  ↓
createSupabaseServerClient() called
  ↓
Something triggers redirect
  ↓
Loop repeats infinitely
```

### Root Cause

**Likely Issue:** Middleware matcher is too broad and catching API routes.

**Current Matcher:**
```typescript
matcher: [
  '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
]
```

This catches **ALL routes** including `/api/auth/session`, which might be causing the redirect loop.

### Fix

**Update middleware matcher to exclude API routes:**

```typescript
// File: src/middleware.ts
export const config = {
  matcher: [
    // Exclude API routes, Next.js internals, and static files
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Alternative:** Add explicit API route check in middleware:

```typescript
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  // Skip middleware for API routes
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }
  
  // ... rest of middleware
}
```

---

## Error #2: 503 Service Unavailable 🔴

### Symptoms
```
api/v1/parents/settings?parent_id=6f53cbef-23d0-4fd6-95a8-ce8c76c0bc62:1  
Failed to load resource: the server responded with a status of 503
```

### Analysis

**Error Chain:**
1. Parent dashboard requests settings
2. Service Worker intercepts request
3. Service Worker tries to fetch from server
4. Server returns 503 (Service Unavailable)
5. Service Worker has no cached data
6. Request fails

**Service Worker Log:**
```
[SW] API fetch failed: TypeError: Failed to fetch
API error: {"error":"Offline","message":"No cached data available"}
```

### Root Cause

**The API route exists** (`src/app/api/v1/parents/settings/route.ts`) but:
1. Service Worker is intercepting the request
2. Network fetch is failing (possibly due to middleware redirect loop)
3. No cached fallback available

### Fix

**Option 1: Fix Service Worker API exclusion**

The service worker shouldn't intercept API v1 routes during development.

**Option 2: Bypass Service Worker for API calls**

Add header to API requests:
```typescript
fetch('/api/v1/parents/settings', {
  headers: {
    'X-Use-Cache': 'false'
  }
})
```

**Option 3: Fix the root redirect issue first**

The 503 might be a symptom of the redirect loop breaking the API routes.

---

## Error #3: Multiple GoTrueClient Instances 🟡

### Symptoms
```
Multiple GoTrueClient instances detected in the same browser context.
```

### Analysis

**Problem:** Creating multiple Supabase client instances in the same browser session.

**Locations creating clients:**
1. `src/lib/supabaseClient.ts` - Browser client
2. `src/lib/supabase/client-pwa.ts` - PWA client
3. `src/lib/supabase-server.ts` - Server client (shouldn't run in browser)

### Root Cause

Multiple files importing and initializing Supabase clients separately.

### Fix

**Ensure singleton pattern:**

```typescript
// src/lib/supabase.ts (single source of truth)
let supabaseInstance: SupabaseClient | null = null

export function getSupabaseBrowserClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return supabaseInstance
}
```

---

## Error #4: Service Worker Fetch Failures 🔴

### Symptoms
```
service-worker.js:146 [SW] API fetch failed: TypeError: Failed to fetch
```

### Analysis

Service Worker is intercepting API requests but failing to:
1. Fetch from network (due to redirect loop)
2. Serve from cache (no cached data)
3. Provide fallback response

### Root Cause

Service Worker strategy for API routes is failing because:
- Network requests fail (redirect loop)
- No cache-first strategy for API routes
- No fallback mechanism

### Fix

**Update Service Worker to skip API routes:**

```javascript
// public/service-worker.js
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // Skip service worker for API routes in development
  if (url.pathname.startsWith('/api/')) {
    return // Let browser handle it
  }
  
  // ... handle other requests
})
```

---

## 🎯 Fix Priority & Implementation Plan

### Phase 1: Fix Redirect Loop (30 min)

**Step 1:** Update middleware matcher to exclude API routes

```typescript
// src/middleware.ts
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Expected Result:** Auth session API stops redirecting

---

### Phase 2: Fix Service Worker (20 min)

**Step 2:** Update Service Worker to skip API routes

```javascript
// public/service-worker.js - Line ~125
function handleApiRequest(request) {
  // In development, bypass service worker for API routes
  if (process.env.NODE_ENV === 'development') {
    return fetch(request)
  }
  
  // ... existing logic
}
```

**Expected Result:** API requests go directly to server

---

### Phase 3: Fix Multiple Clients (15 min)

**Step 3:** Consolidate Supabase client creation

**Expected Result:** Single client instance

---

## 🧪 Testing Checklist

After fixes:

- [ ] `/api/auth/session` returns 200 (not redirect loop)
- [ ] Parent dashboard loads successfully
- [ ] Settings API returns data (not 503)
- [ ] Console shows no GoTrueClient warning
- [ ] Service Worker logs show successful API fetches
- [ ] Auth initialization completes without errors

---

## 📊 Impact Analysis

| Component | Current State | After Fix |
|-----------|--------------|-----------|
| Auth System | ❌ Broken | ✅ Working |
| Parent Dashboard | ❌ Unusable | ✅ Functional |
| Service Worker | ❌ Failing | ✅ Optimized |
| Memory Usage | ⚠️ Leaking | ✅ Efficient |

---

## Summary

**Root Cause:** Middleware matcher too broad → catches API routes → redirect loop  
**Cascade Effect:** API failures → Service Worker failures → App unusable  
**Solution:** Exclude `/api/*` from middleware matcher  
**Time to Fix:** ~1 hour total

**Immediate Action Required:**
1. Update middleware matcher
2. Test auth session endpoint
3. Verify parent dashboard works
