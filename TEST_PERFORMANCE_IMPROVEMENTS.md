# Testing Performance Improvements

## 🧪 Quick Test Guide

### Test 1: Verify Quota Endpoint Switch
**What to check:** QuotaIndicator now uses lightweight endpoint

1. Open student homework helper page
2. Open browser DevTools → Network tab
3. Filter by "quota" or "gemini"
4. **Expected:** 
   - ✅ Calls to `/api/quota/status` (NEW)
   - ❌ No calls to `/api/chat/gemini-extended` with GET method
   - See `X-Cache: HIT` header after first request

**Before:** 600+ calls to heavy endpoint  
**After:** ~2-5 calls to lightweight endpoint per session

---

### Test 2: Verify Caching Works
**What to check:** 1-minute cache is active

1. Open homework helper
2. Wait 10 seconds
3. Check Network tab for `/api/quota/status`
4. **Expected:** 
   - First call: `X-Cache: MISS` (200ms)
   - Within 60s: `X-Cache: HIT` (<50ms)

---

### Test 3: Webpack Cache Performance
**What to check:** Faster rebuilds after first compilation

1. Stop dev server (Ctrl+C)
2. Delete `.next/` folder (optional for clean test)
3. Run `npm run dev`
4. Navigate to any page
5. Make small code change (add comment)
6. Save and wait for rebuild

**Expected:**
- First build: 8-15s (building cache)
- Second build: 3-5s (50-70% faster)
- Look for `.next/cache/webpack/` directory

---

## 📊 Performance Metrics to Track

### Browser Network Tab:
```
Before Optimization:
- /api/chat/gemini-extended (GET): 400-800ms × 600 calls
- /api/get-profile: 1070ms × multiple calls
- /api/auth/session: 1300-4000ms

After Optimization:
- /api/quota/status: 50-100ms × 2-5 calls (95% faster)
- /api/get-profile: <100ms with cache hits
- /api/auth/session: <100ms with cache hits
```

### Compilation Times:
```
Before:
- /api/get-profile: 15.1s (1815 modules)
- /student page: 8.2s (1730 modules)
- /student/homework-helper: 7.9s (3740 modules)

After (with cache):
- Second compile: 3-5s (60-70% faster)
- Hot reload: 1-2s (40-50% faster)
```

---

## ✅ Success Criteria

You've successfully optimized if:
- [ ] QuotaIndicator shows `X-Cache: HIT` in Network tab
- [ ] No more GET calls to `/api/chat/gemini-extended`
- [ ] Webpack cache directory exists at `.next/cache/webpack/`
- [ ] Second build is significantly faster than first
- [ ] Profile API shows cache hits in console logs

---

## 🐛 Troubleshooting

### Issue: Still seeing GET calls to /api/chat/gemini-extended
**Fix:** Hard refresh browser (Ctrl+Shift+R) or clear browser cache

### Issue: Webpack cache not working
**Check:** 
1. Verify `.next/cache/webpack/` directory exists
2. Check `next.config.js` has `config.cache` settings
3. Try deleting `.next/` and restarting

### Issue: Profile cache always missing
**Note:** This is normal in dev mode after code changes (hot reload clears memory)

### Issue: Slow compilation still happening
**Note:** First compile after restart is always slow (building cache). Second compile should be faster.

---

## 🎯 Quick Win Verification

**5-Second Test:**
1. Open homework helper
2. Open DevTools Network
3. Look for `/api/quota/status`
4. See `X-Cache: HIT` 
5. ✅ Optimization working!
