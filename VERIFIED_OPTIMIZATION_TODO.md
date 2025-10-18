# ✅ VERIFIED OPTIMIZATION TODO - Student Dashboard

## 🔍 VERIFICATION COMPLETE - All Issues Match Codebase

### ✓ Duplicate `/api/get-profile` - CONFIRMED
- **Found in:** `src/lib/redux/slices/authSlice.ts` (lines 37, 64, 136)
- **Cause:** Redux calls it 3 times during auth initialization

### ✓ Duplicate `/api/student/school-info` - CONFIRMED  
- **Found in:** `src/app/(dashboard)/student/page.tsx` (line 460, 639)
- **Cause:** useEffect deps include `loading` (line 654) triggering re-fetch

### ✓ 6 Sequential Quest Queries - CONFIRMED
- **Found in:** `src/app/api/student/dashboard/route.ts` (lines 254-318)
- Queries: gratitude_entries, courage_log, kindness_counter, breathing_sessions, habit_tracker, gratitude (recent)

### ✓ Excessive Data Returned - CONFIRMED
- **Dashboard API:** 23 fields returned, only 13 needed (43% waste)
- **School Info API:** 25 fields returned, only 8 needed (68% waste)

---

## 📋 IMPLEMENTATION TASKS

### PHASE 1: Backend (HIGH PRIORITY)

**Task 1: Create Database View** 
```sql
-- File: database/views/student_dashboard_view.sql
CREATE VIEW student_dashboard_view AS
SELECT p.*, 
  jsonb_build_object('gratitude', EXISTS(SELECT 1 FROM gratitude_entries...)) as quests_status
FROM profiles p WHERE role = 'student';
```
- [ ] Create SQL file
- [ ] Run migration
- [ ] Test view performance

**Task 2: Optimized Dashboard Endpoint**
- [ ] Create `/api/student/dashboard-optimized/route.ts`
- [ ] Use view instead of 6 queries
- [ ] Return only 13 profile fields
- [ ] Test with Postman

**Task 3: Minimal School Info Endpoint**
- [ ] Create `/api/student/school-info-minimal/route.ts`  
- [ ] Return only 8 fields
- [ ] Test response size (should be 0.3KB vs 5KB)

### PHASE 2: Frontend (HIGH PRIORITY)

**Task 4: Fix Redux Duplicates**
```typescript
// File: src/lib/redux/slices/authSlice.ts
let inFlightRequest = null
// Reuse promise to prevent duplicate calls
```
- [ ] Add request deduplication
- [ ] Test auth flow

**Task 5: Fix useEffect Dependencies**
```typescript
// File: src/app/(dashboard)/student/page.tsx line 654
// Remove 'loading' from dependencies
}, [authChecked, authLoading, reduxUser, reduxProfile, router])
```
- [ ] Update dependencies
- [ ] Test no duplicate school-info calls

**Task 6: Switch to Optimized Endpoints**
- [ ] Line 502: Use `/dashboard-optimized`
- [ ] Line 460: Use `/school-info-minimal`
- [ ] Test dashboard loads correctly

**Task 7: Parallel Loading**
```typescript
// Load all 4 APIs at once instead of sequential
Promise.all([dashboard, school, announcements, polls])
```
- [ ] Refactor lines 636-643
- [ ] Test all data loads

**Task 8: Remove Console Logs**
- [ ] Delete devLog function (lines 26-29)
- [ ] Remove 52 devLog calls
- [ ] Test no console spam

### PHASE 3: Testing

**Task 9: Performance Validation**
- [ ] Measure with Chrome DevTools
- [ ] Verify < 2.5s load time
- [ ] Check no duplicate API calls
- [ ] Run Lighthouse audit

**Task 10: User Testing**
- [ ] Test with 5 student accounts
- [ ] Verify all features work
- [ ] Check mobile responsive
- [ ] No console errors

---

## 🎯 EXPECTED RESULTS

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Load Time | 12s | 2s | -83% |
| Dashboard API | 4.4s | 0.2s | -95% |
| School API | 2.7s | 0.15s | -94% |
| DB Queries | 15+ | 2 | -87% |
| Data Size | 25KB | 5KB | -80% |

---

## ⚠️ RISKS & MITIGATION

**Risk:** Database view might be slow
**Fix:** Use EXPLAIN ANALYZE, add indexes if needed

**Risk:** Frontend breaks with new endpoints  
**Fix:** Keep old endpoints active, gradual rollout

**Risk:** Cache shows stale data
**Fix:** 2-minute TTL, invalidate on updates

---

## 🚀 READY TO START

All issues verified against actual code. No assumptions made.

**Waiting for your GO command to begin implementation.**
