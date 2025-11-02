# 🚀 Quick Start: Performance Optimization

## 📋 Prerequisites Checklist

- [ ] Node.js 20+ installed
- [ ] Supabase project with admin access
- [ ] Redis installed (optional but recommended)

---

## ⚡ Fast Setup (5 minutes)

### Step 1: Install Dependencies

```bash
npm install
```

This automatically installs the new `redis` dependency.

### Step 2: Configure Environment

Copy `.env.example` to `.env.local` and configure:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional (but recommended for best performance)
REDIS_URL=redis://localhost:6379
```

### Step 3: Run Database Migrations

Open Supabase SQL Editor and run these migrations **in order**:

1. **Critical Indexes** (Run first - immediate performance boost)
   ```sql
   -- File: database/migrations/041_student_dashboard_performance_indexes.sql
   -- Creates all critical indexes
   -- Takes ~30 seconds
   ```

2. **Materialized Views** (Run second - enables advanced optimizations)
   ```sql
   -- File: database/migrations/042_student_dashboard_materialized_views.sql
   -- Creates pre-computed data views
   -- Takes ~1 minute
   -- Then run: SELECT refresh_student_dashboard_views();
   ```

3. **Setup Auto-Refresh** (Optional - keeps views fresh)
   ```sql
   -- Refresh views every 5 minutes
   SELECT cron.schedule(
     'refresh-student-views',
     '*/5 * * * *',
     'SELECT refresh_student_dashboard_views()'
   );
   ```

### Step 4: Start Redis (Optional)

**Using Docker:**
```bash
docker run -d -p 6379:6379 --name redis redis:alpine
```

**Using Homebrew (Mac):**
```bash
brew install redis
brew services start redis
```

**Skip Redis:**
If you skip Redis, the system automatically uses in-memory cache (works fine but less performant).

### Step 5: Validate Setup

```bash
npm run validate:setup
```

This checks:
- ✅ Database connection
- ✅ Indexes created
- ✅ Materialized views available
- ✅ Redis connection (if configured)
- ✅ API endpoints working

### Step 6: Start Development Server

```bash
npm run dev
```

---

## 🧪 Test Performance

```bash
# Set auth token in environment
export TEST_AUTH_TOKEN=your-valid-auth-token

# Run performance tests
npm run test:performance
```

**Expected Results:**
- Growth API: <500ms (cached), <1.5s (fresh)
- Today API: <400ms (cached), <1.2s (fresh)  
- Unified API: <500ms (all data in one request)

---

## 🎯 Using Optimized APIs

### Option 1: Use Separate Optimized APIs

```typescript
// Old (slow)
const growth = await fetch('/api/v2/student/growth')
const today = await fetch('/api/v2/student/today')
// Total: ~9 seconds

// New (fast)
const growth = await fetch('/api/v2/student/growth-optimized')
const today = await fetch('/api/v2/student/today-optimized')
// Total: <1 second
```

### Option 2: Use Unified API (Recommended)

```typescript
// Best: Single request gets everything
const dashboard = await fetch('/api/v2/student/dashboard-unified')
const data = await dashboard.json()

// Returns:
// - data.profile
// - data.growth (GPA, tests, subjects, achievements)
// - data.today (quests, exams, progress, school updates)
```

---

## 🔄 Gradual Migration (Zero Downtime)

Deploy optimized APIs alongside existing ones:

```typescript
// Use feature flag for gradual rollout
const useOptimized = process.env.NEXT_PUBLIC_USE_OPTIMIZED_APIS === 'true'

const endpoint = useOptimized 
  ? '/api/v2/student/growth-optimized'
  : '/api/v2/student/growth'
```

---

## 🩺 Health Check

```bash
curl http://localhost:3000/api/health
```

**Response:**
```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "healthy" },
    "materializedViews": { "status": "healthy" },
    "cache": { "status": "healthy", "redisConnected": true },
    "indexes": { "status": "healthy", "queryTime": "45ms" }
  }
}
```

---

## 🐛 Troubleshooting

### Database Migration Failed

```sql
-- Check if indexes exist
SELECT indexname FROM pg_indexes 
WHERE tablename = 'profiles' 
AND indexname LIKE 'idx_profiles%';

-- Check if views exist
SELECT matviewname, last_refresh FROM pg_matviews 
WHERE schemaname = 'public';
```

### Redis Connection Issues

```bash
# Test Redis
redis-cli ping
# Should return: PONG

# If fails, restart Redis
docker restart redis
# OR
brew services restart redis
```

### Views Not Refreshing

```sql
-- Manual refresh
SELECT refresh_student_dashboard_views();

-- Check cron job
SELECT * FROM cron.job WHERE jobname = 'refresh-student-views';
```

### Slow Queries Still Persist

```sql
-- Update statistics
ANALYZE profiles;
ANALYZE test_results;
ANALYZE assessments;
ANALYZE daily_quests;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE tablename IN ('profiles', 'test_results', 'assessments')
ORDER BY idx_scan DESC;
```

---

## 📊 Expected Performance Gains

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Auth + Profile | 1100ms | 200ms | **82% faster** |
| Growth API | 5000ms | 400ms | **92% faster** |
| Today API | 3900ms | 350ms | **91% faster** |
| Total Page Load | 12000ms | 800ms | **93% faster** |

---

## 🎓 What Was Optimized?

1. **Database Layer**
   - 20+ critical indexes added
   - 7 materialized views for pre-computed data
   - Query performance improved by 60-80%

2. **Application Layer**
   - Shared auth middleware (eliminates duplicate auth checks)
   - Redis caching with stale-while-revalidate
   - Request deduplication
   - Parallel data fetching

3. **API Layer**
   - Optimized endpoints using materialized views
   - Unified API for single-request dashboards
   - Compression support
   - Proper cache headers

4. **Infrastructure**
   - In-memory cache fallback
   - Error handling and retry logic
   - Health monitoring
   - Performance testing utilities

---

## 📚 Additional Resources

- Full deployment guide: `docs/PERFORMANCE_OPTIMIZATION_DEPLOYMENT.md`
- API documentation: `docs/API_PERFORMANCE_ANALYSIS.md`
- Migration files: `database/migrations/041_*.sql` and `042_*.sql`

---

## ✅ Success Criteria

You've successfully optimized when:

- ✅ `npm run validate:setup` passes
- ✅ Health check returns `"status": "healthy"`
- ✅ Dashboard loads in <1 second
- ✅ All API responses have cache headers
- ✅ Performance tests show >80% improvement

---

**Need help?** Check the troubleshooting section or review the health check output for specific issues.
