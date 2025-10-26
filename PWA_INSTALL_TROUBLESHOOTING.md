# PWA Install Prompt Troubleshooting

## ✅ Fixed Issues

### 1. Manifest Icon Paths
- **Problem**: Icons used relative paths `../icons/icon-*.webp`
- **Fixed**: Changed to absolute paths `/icons/icon-*.webp`
- **Fixed**: Corrected MIME type from `image/png` to `image/webp`

## 🔍 Requirements for PWA Install Prompt

The browser will ONLY show the install prompt if ALL conditions are met:

### Required Conditions:

1. **HTTPS Connection** ✅
   - Must be served over HTTPS (or localhost for testing)
   - Check: `window.location.protocol === 'https:'`

2. **Valid Manifest** ✅
   - Must have valid manifest.json
   - Must include name, icons (192px & 512px), start_url, display
   - Check browser console for manifest errors

3. **Service Worker Registered** ✅
   - Service worker must be registered and active
   - Check: Chrome DevTools > Application > Service Workers

4. **Icons Available** ⚠️
   - Icons must be accessible at the specified paths
   - Check: Open `http://localhost:3000/icons/icon-192.webp` in browser
   - **ACTION NEEDED**: Verify all icon files exist

5. **User Engagement** ⚠️
   - User must interact with site (click, tap, etc.)
   - Chrome requires 30 seconds of engagement before showing prompt

6. **Not Previously Dismissed** ⚠️
   - Check localStorage: `pwa-install-dismissed`
   - Clear to test: `localStorage.removeItem('pwa-install-dismissed')`

7. **Not Already Installed** ⚠️
   - Prompt won't show if PWA is already installed
   - Check: Chrome > More Tools > Uninstall app

## 🧪 Testing Steps

### 1. Clear All PWA Data
```javascript
// Run in browser console:
localStorage.removeItem('pwa-install-dismissed')
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister())
})
```

### 2. Verify Icons Load
Open these URLs in browser:
- http://localhost:3000/icons/icon-48.webp
- http://localhost:3000/icons/icon-192.webp
- http://localhost:3000/icons/icon-512.webp

### 3. Check Manifest
- Open: Chrome DevTools > Application > Manifest
- Look for errors or warnings
- Verify all icons show green checkmarks

### 4. Check Service Worker
- Open: Chrome DevTools > Application > Service Workers
- Should show: Status "activated and is running"
- If "waiting to activate", click "skipWaiting"

### 5. Test Install Prompt
1. Close all site tabs
2. Clear browser cache (Ctrl+Shift+Delete)
3. Reopen site
4. Interact with page (click around)
5. Wait 30 seconds
6. Install prompt should appear

## 🔧 Quick Fixes

### If Icons Return 404:
The `/icons/` folder exists but files might not be accessible. Two options:

**Option A: Copy icons to public folder**
```bash
# From project root
Copy-Item -Path "icons\*" -Destination "public\icons\" -Recurse -Force
```

**Option B: Use existing public icons**
Update manifest.json to use:
```json
{
  "src": "/icon-192x192.png",
  "sizes": "192x192"
},
{
  "src": "/icon-512x512.png", 
  "sizes": "512x512"
}
```

### Force Service Worker Update:
```javascript
// In browser console:
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.update())
})
```

## 📱 Mobile Testing

### Android Chrome:
1. Visit site in Chrome mobile
2. Chrome will show "Add to Home screen" in menu
3. Or banner appears automatically after engagement

### iOS Safari:
- iOS doesn't support PWA install prompts
- Users manually add via Share > Add to Home Screen
- Our manifest supports iOS web app mode

## ⚡ Current Status Check

Run this in browser console:
```javascript
console.log('HTTPS:', location.protocol === 'https:' || location.hostname === 'localhost')
console.log('Service Worker:', 'serviceWorker' in navigator)
console.log('Manifest Link:', document.querySelector('link[rel="manifest"]')?.href)
console.log('Already Installed:', window.matchMedia('(display-mode: standalone)').matches)
console.log('Install Dismissed:', localStorage.getItem('pwa-install-dismissed'))
```

## 🎯 Most Common Issues

1. **Icons return 404** → Copy icons to public folder
2. **Already installed** → Uninstall the PWA first
3. **Previously dismissed** → Clear localStorage
4. **Service worker not active** → Hard refresh (Ctrl+Shift+R)
5. **Not enough engagement** → Wait 30 seconds and interact

## 💡 Next Steps

1. **Verify icons exist** at `/icons/` path or copy them to public
2. **Hard refresh** the page (Ctrl+Shift+R)
3. **Clear localStorage** and service worker
4. **Interact with site** for 30+ seconds
5. **Check console** for any errors
