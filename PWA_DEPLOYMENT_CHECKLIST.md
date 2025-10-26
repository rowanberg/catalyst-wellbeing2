# 🚀 PWA Deployment Checklist

Complete this checklist before deploying your PWA to production.

---

## ✅ Pre-Deployment Tasks

### **1. Environment Variables**
- [ ] Add `NEXT_PUBLIC_SUPABASE_URL` to production environment
- [ ] Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` to production environment
- [ ] Verify `SUPABASE_SERVICE_ROLE_KEY` is ONLY in server-side env (not client)
- [ ] Test environment variables load correctly

### **2. PWA Assets**
- [ ] Generate 512x512 icon: `public/icon-512x512.png`
- [ ] Generate 192x192 icon: `public/icon-192x192.png`
- [ ] Generate Apple touch icon (180x180): `public/apple-touch-icon.png`
- [ ] Create favicon: `public/favicon.ico`
- [ ] Optional: Add screenshots for app stores (1280x720 & 720x1280)
- [ ] Verify all icons display correctly

**Quick Icon Generation:**
```bash
# Using online tools or:
npx pwa-asset-generator logo.png public/ --icon-only --path-override /
```

### **3. Service Worker**
- [ ] Verify `public/service-worker.js` exists
- [ ] Verify `public/offline.html` exists
- [ ] Test service worker registration in DevTools
- [ ] Check caching strategies work correctly
- [ ] Verify cache cleanup runs properly

### **4. Manifest File**
- [ ] Verify `public/manifest.json` exists
- [ ] Update app name and description
- [ ] Update theme color to match brand
- [ ] Test manifest validation: https://manifest-validator.appspot.com/
- [ ] Verify shortcuts work (student, teacher, admin, parent)

### **5. HTTPS Configuration**
- [ ] Verify production uses HTTPS (REQUIRED for PWA)
- [ ] Test SSL certificate is valid
- [ ] Check mixed content warnings (none should exist)
- [ ] Verify service worker loads over HTTPS

### **6. Dashboard Integration**
- [ ] Test Student dashboard offline mode
- [ ] Test Teacher dashboard offline mode
- [ ] Test Admin dashboard offline mode
- [ ] Test Parent dashboard offline mode
- [ ] Verify all use `OfflineAPI` wrapper
- [ ] Check IndexedDB caching works

### **7. Authentication**
- [ ] Test 1-month session persistence
- [ ] Verify auto-refresh tokens work
- [ ] Test offline authentication
- [ ] Check logout clears IndexedDB
- [ ] Verify no sensitive data in localStorage

### **8. Offline Features**
- [ ] Test app loads offline
- [ ] Test dashboard data displays from cache
- [ ] Test offline queue for form submissions
- [ ] Verify background sync triggers when online
- [ ] Check offline indicator displays correctly

### **9. Install Experience**
- [ ] Test install prompt shows on desktop
- [ ] Test "Add to Home Screen" on iOS Safari
- [ ] Test "Install App" on Android Chrome
- [ ] Verify installed app launches correctly
- [ ] Check app icon appears on home screen

### **10. Performance**
- [ ] Run Lighthouse PWA audit (score 90+)
- [ ] Check page load times (<3s)
- [ ] Verify cache hit rates in Network tab
- [ ] Test IndexedDB query performance
- [ ] Check memory usage is reasonable

---

## 🧪 Testing Procedures

### **Test 1: Basic PWA Installation**
1. Open site in Chrome (desktop or mobile)
2. Wait for install prompt or click ⋮ → "Install Catalyst"
3. Click Install
4. Verify app opens in standalone window
5. Close and reopen from home screen/start menu

### **Test 2: Offline Mode**
1. Open app and login
2. Navigate to dashboard
3. Open DevTools → Application → Service Workers
4. Check "Offline" checkbox
5. Navigate around dashboards
6. Verify cached data displays correctly
7. Try submitting a form (should queue)
8. Uncheck "Offline"
9. Verify queued actions sync automatically

### **Test 3: Session Persistence**
1. Login to app
2. Close browser completely
3. Wait 5 minutes
4. Reopen app
5. Verify still logged in (no redirect to login)
6. Check session refreshes automatically

### **Test 4: Background Sync**
1. Go offline
2. Submit a form (attendance, grades, etc.)
3. See "Queued for sync" message
4. Go back online
5. Verify data syncs automatically
6. Check success notification appears

### **Test 5: Cache Updates**
1. Open app (cached version loads)
2. Update code on server
3. Deploy new version
4. Open app again
5. Verify update notification appears
6. Click "Update Now"
7. Verify new version loads

---

## 🔍 Debugging Tools

### **Chrome DevTools**
- **Application Tab:**
  - Service Workers: Check registration and status
  - Cache Storage: View cached assets and API responses
  - IndexedDB → CatalystPWA: View stored data
  - Manifest: Verify manifest loads correctly

- **Network Tab:**
  - Filter by "ServiceWorker" to see cached requests
  - Check "(from ServiceWorker)" in Size column
  - Verify offline requests queue properly

- **Console:**
  - Look for `[SW]` logs from service worker
  - Check `[IndexedDB]` logs from cache operations
  - Monitor `[OfflineAPI]` logs for API calls

### **Lighthouse Audit**
```bash
# Run PWA audit
1. Open DevTools → Lighthouse tab
2. Select "Progressive Web App"
3. Click "Generate Report"
4. Target score: 90+ (out of 100)
```

**Key PWA Criteria:**
- ✅ Fast and reliable (loads offline)
- ✅ Installable (manifest + service worker)
- ✅ Optimized (page load <3s)

---

## 🚨 Common Issues & Solutions

### **Issue: Service Worker Not Registering**
**Solution:**
- Ensure HTTPS is enabled
- Clear browser cache
- Check service worker file path is `/service-worker.js`
- Verify no syntax errors in service worker

### **Issue: Install Prompt Not Showing**
**Solution:**
- Check manifest is valid
- Ensure HTTPS is enabled
- Wait 30 seconds after first visit
- Check if user already dismissed prompt
- Verify browser supports PWA (Chrome, Edge, Samsung Internet)

### **Issue: Offline Mode Not Working**
**Solution:**
- Check service worker is active (not waiting)
- Verify cache is populated (refresh page once online)
- Check IndexedDB has data
- Look for console errors

### **Issue: Auth Token Expired**
**Solution:**
- Verify refresh token is stored in IndexedDB
- Check auto-refresh logic in `client-pwa.ts`
- Ensure Supabase session has refresh token
- Check network for refresh token API calls

### **Issue: Background Sync Not Working**
**Solution:**
- Check `navigator.sync` is supported
- Verify offline queue in IndexedDB has pending items
- Check service worker sync event listener
- Manually trigger with: `registration.sync.register('sync-offline-data')`

---

## 📊 Performance Benchmarks

### **Target Metrics**
- **First Contentful Paint (FCP):** <1.8s
- **Largest Contentful Paint (LCP):** <2.5s
- **Time to Interactive (TTI):** <3.8s
- **Total Blocking Time (TBT):** <200ms
- **Cumulative Layout Shift (CLS):** <0.1
- **PWA Score:** 90+

### **Cache Performance**
- **Cache Hit Rate:** >80%
- **IndexedDB Query Time:** <50ms
- **Service Worker Response:** <100ms
- **Offline Page Load:** <500ms

---

## 🎯 Production Deployment

### **Netlify**
```bash
# Build and deploy
npm run build
netlify deploy --prod

# Environment variables in Netlify UI:
# Settings → Environment Variables
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

### **Vercel**
```bash
# Deploy
vercel --prod

# Environment variables in Vercel UI:
# Settings → Environment Variables
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

### **Custom Server**
```bash
# Build
npm run build

# Start
npm start

# Or with PM2
pm2 start npm --name "catalyst-pwa" -- start
```

---

## ✅ Post-Deployment Verification

- [ ] Visit production URL
- [ ] Check manifest loads (view-source:/manifest.json)
- [ ] Verify service worker registers
- [ ] Test install on mobile device
- [ ] Test offline mode on production
- [ ] Check analytics for PWA installs
- [ ] Monitor error logs for PWA issues
- [ ] Verify SSL certificate is valid
- [ ] Test on multiple browsers (Chrome, Safari, Edge)
- [ ] Test on multiple devices (iOS, Android, Desktop)

---

## 📱 App Store Submission (Optional)

If you want to submit to app stores:

### **Google Play Store (via TWA - Trusted Web Activity)**
1. Use Bubblewrap: `npm install -g @bubblewrap/cli`
2. Generate TWA: `bubblewrap init --manifest=https://your-domain.com/manifest.json`
3. Build APK: `bubblewrap build`
4. Submit to Play Store

### **Apple App Store**
1. Wrap PWA with Capacitor or Cordova
2. Follow Apple's submission guidelines
3. Or wait for iOS 17.4+ PWA support in EU

---

## 🎉 Success Criteria

Your PWA is ready when:
- ✅ Lighthouse PWA score is 90+
- ✅ App installs on all devices
- ✅ Works fully offline
- ✅ Auth persists for 30 days
- ✅ Background sync works
- ✅ Cache hit rate >80%
- ✅ Page loads <3 seconds
- ✅ No console errors
- ✅ All dashboards work offline
- ✅ HTTPS enabled in production

---

**Last Updated:** 2025-10-20
**Version:** 1.0.0
