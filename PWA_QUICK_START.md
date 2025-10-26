# ⚡ PWA Quick Start Guide

Get your Catalyst PWA up and running in 5 minutes.

---

## 🚀 Step 1: Install Dependencies

```bash
npm install dexie
```

---

## 🔑 Step 2: Configure Environment Variables

Create `.env.local` file:

```bash
# Copy example file
cp .env.example .env.local
```

Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**⚠️ SECURITY:** Never use `SUPABASE_SERVICE_ROLE_KEY` in client-side code!

---

## 🎨 Step 3: Generate PWA Icons

You need 3 icons:
- `512x512` → `public/icon-512x512.png`
- `192x192` → `public/icon-192x192.png`
- `180x180` → `public/apple-touch-icon.png`

### Option 1: Online Tool
Use https://realfavicongenerator.net/

### Option 2: Command Line
```bash
# Install generator
npm install -g pwa-asset-generator

# Generate icons (replace 'logo.png' with your logo)
npx pwa-asset-generator logo.png public/ \
  --icon-only \
  --path-override / \
  --favicon \
  --type png
```

### Option 3: Manual (Quick & Simple)
1. Create a 512x512 PNG logo
2. Resize to 192x192 for second icon
3. Resize to 180x180 for Apple icon
4. Place in `public/` folder

---

## 🧪 Step 4: Test Locally

```bash
# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

### Test PWA Features:

1. **Service Worker Registration**
   - Open DevTools → Application → Service Workers
   - Should see "activated and running"

2. **Install Prompt**
   - Wait 30 seconds after page load
   - Click ⋮ menu → "Install Catalyst"
   - Or use install banner

3. **Offline Mode**
   - Application → Service Workers → check "Offline"
   - Navigate dashboards
   - Data should load from cache

4. **IndexedDB Storage**
   - Application → IndexedDB → CatalystPWA
   - Should see tables: dashboards, authSessions, offlineQueue

---

## 📱 Step 5: Test on Mobile

### iOS (Safari):
```
1. Open site on iPhone/iPad
2. Tap Share button (□↑)
3. Scroll down → "Add to Home Screen"
4. Tap "Add"
5. App appears on home screen
```

### Android (Chrome):
```
1. Open site on Android device
2. Look for "Add to Home Screen" banner
3. Tap "Install"
4. Or: Menu (⋮) → "Add to Home Screen"
5. App appears in app drawer
```

---

## ✅ Verification Checklist

- [ ] Service worker registers without errors
- [ ] Manifest.json loads (visit `/manifest.json`)
- [ ] Icons display correctly
- [ ] Install prompt appears (desktop)
- [ ] App installs successfully
- [ ] Offline mode works (loads cached data)
- [ ] Auth persists after browser close
- [ ] Background sync queues actions when offline

---

## 🐛 Quick Troubleshooting

### Issue: Service Worker Won't Register
```bash
# Clear cache and hard reload
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# Or manually:
DevTools → Application → Clear Storage → "Clear site data"
```

### Issue: Icons Not Showing
```bash
# Check files exist:
ls -la public/icon-*.png
ls -la public/apple-touch-icon.png

# Verify manifest references correct paths
cat public/manifest.json | grep "icon"
```

### Issue: Offline Mode Not Working
```typescript
// Check if OfflineAPI is imported
// In dashboard files, look for:
import { OfflineAPI } from '@/lib/api/offline-wrapper'

// Check if API calls use OfflineAPI:
await OfflineAPI.fetchStudentDashboard()
```

---

## 📊 Monitor PWA Performance

### Chrome DevTools:
```
1. Open DevTools → Lighthouse
2. Select "Progressive Web App"
3. Click "Generate Report"
4. Target: 90+ score
```

### Check Cache Effectiveness:
```
1. Network tab
2. Look for "(ServiceWorker)" in Size column
3. Should see cached responses
```

### Monitor IndexedDB:
```javascript
// In console:
const db = await indexedDB.open('CatalystPWA', 1)
console.log('Database opened:', db)

// Check storage usage:
navigator.storage.estimate().then(estimate => {
  console.log('Storage used:', (estimate.usage / 1024 / 1024).toFixed(2), 'MB')
  console.log('Storage quota:', (estimate.quota / 1024 / 1024).toFixed(2), 'MB')
})
```

---

## 🎯 Next Steps

1. **Customize Theme**
   - Edit `public/manifest.json` → `theme_color`
   - Edit `src/app/layout.tsx` → `themeColor`

2. **Add Push Notifications** (Optional)
   - Set up Firebase Cloud Messaging
   - Request notification permission
   - Handle background messages

3. **Deploy to Production**
   - Follow `PWA_DEPLOYMENT_CHECKLIST.md`
   - Ensure HTTPS is enabled
   - Test on real devices

---

## 📚 Documentation

- **Full Implementation Guide:** `PWA_IMPLEMENTATION_GUIDE.md`
- **Deployment Checklist:** `PWA_DEPLOYMENT_CHECKLIST.md`
- **API Documentation:** See inline comments in:
  - `src/lib/db/indexeddb.ts`
  - `src/lib/supabase/client-pwa.ts`
  - `src/lib/api/offline-wrapper.ts`

---

## 💡 Tips & Best Practices

1. **Cache Duration:** Default is 5 minutes. Adjust in `indexeddb.ts`:
   ```typescript
   if (age < 5 * 60 * 1000) { // Change here
   ```

2. **Offline Queue Retries:** Default is 3 attempts. Change in `indexeddb.ts`:
   ```typescript
   if (action.retries >= 3) { // Change here
   ```

3. **Auth Token Expiry:** Default is 30 days. Change in `indexeddb.ts`:
   ```typescript
   const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000) // Change here
   ```

4. **Clear Cache on Deploy:**
   - Update `CACHE_VERSION` in `public/service-worker.js`
   - Old caches auto-delete

---

## 🎉 You're Ready!

Your PWA is now configured with:
- ✅ Offline support
- ✅ Installable on all platforms
- ✅ 30-day auth persistence
- ✅ Background sync
- ✅ Fast cached loading

**Happy coding! 🚀**
