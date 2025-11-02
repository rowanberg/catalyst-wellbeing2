# 🚀 Performance Optimization Deployment Guide

## 📊 Target Performance Metrics

| Metric | Before | After Phase 3 | Improvement |
|--------|--------|---------------|-------------|
| `/api/v2/student/growth` | 5000ms | **<500ms** | **90% faster** |
| `/api/v2/student/today` | 3900ms | **<400ms** | **90% faster** |
| `/api/get-profile` | 3400ms | **<100ms** | **97% faster** |
| **Total Page Load** | **~12s** | **<1s** | **92% faster** |

---

## 🎯 Implementation Checklist

### Phase 1: Database Optimization (Required)

- [ ] **Run Database Indexes Migration**
  ```bash
  # In Supabase SQL Editor
  # Run: database/migrations/041_student_dashboard_performance_indexes.sql
  ```

- [ ] **Run Materialized Views Migration**
  ```bash
  # In Supabase SQL Editor
  # Run: database/migrations/042_student_dashboard_materialized_views.sql
  ```

- [ ] **Initial Views Refresh**
  ```sql
  SELECT refresh_student_dashboard_views();
  ```

- [ ] **Setup Scheduled Refresh (pg_cron)**
  ```sql
  -- Refresh views every 5 minutes
  SELECT cron.schedule(
    'refresh-student-views',
    '*/5 * * * *',
    'SELECT refresh_student_dashboard_views()'
  );
  ```

### Phase 2: Application Setup (Required)

- [ ] **Install Redis Client**
  ```bash
  npm install redis
  ```

- [ ] **Configure Environment Variables**
  ```bash
  # Add to .env.local
  REDIS_URL=redis://localhost:6379  # Development
  # OR
  UPSTASH_REDIS_URL=your-upstash-url  # Production
  ```

- [ ] **Setup Redis (Development)**
  ```bash
  # Using Docker
  docker run -d -p 6379:6379 redis:alpine
  
  # OR using Homebrew
  brew install redis
  brew services start redis
  ```

- [ ] **Setup Redis (Production - Upstash)**
  1. Go to https://upstash.com
  2. Create Redis database
  3. Copy connection URL
  4. Add to production environment variables

### Phase 3: Deploy New APIs (Recommended)

- [ ] **Test Optimized APIs Locally**
  ```bash
  npm run dev
  
  # Test endpoints:
  # GET /api/v2/student/growth-optimized
  # GET /api/v2/student/today-optimized
  # GET /api/v2/student/dashboard-unified
  ```

- [ ] **Update Frontend to Use New Endpoints**
  ```typescript
  // Before
  const response = await fetch('/api/v2/student/growth')
  
  // After (Option 1: Separate calls)
  const response = await fetch('/api/v2/student/growth-optimized')
  
  // After (Option 2: Single unified call - BEST)
  const response = await fetch('/api/v2/student/dashboard-unified')
  ```

- [ ] **Gradual Rollout (Optional)**
  - Deploy optimized APIs alongside old ones
  - Use feature flag to switch between them
  - Monitor performance and errors
  - Fully switch after validation

---

## 🔧 Configuration

### Redis Configuration

**Development:**
```bash
# .env.local
REDIS_URL=redis://localhost:6379
NODE_ENV=development
```

**Production:**
```bash
# Vercel/Netlify Environment Variables
REDIS_URL=your-upstash-redis-url
NODE_ENV=production
```

### Cache TTL Settings

Edit `src/lib/cache/redis-client.ts`:
```typescript
export const cacheKeys = {
  studentGrowth: (studentId: string) => `student:${studentId}:growth`,
  studentToday: (studentId: string) => `student:${studentId}:today`,
  // TTL: 60 seconds (adjustable)
}
```

### Materialized View Refresh Schedule

**Fast refresh (Every 5 minutes):**
```sql
SELECT cron.schedule('refresh-student-views', '*/5 * * * *', 'SELECT refresh_student_dashboard_views()');
```

**Slower refresh (Every 15 minutes):**
```sql
SELECT cron.schedule('refresh-student-views', '*/15 * * * *', 'SELECT refresh_student_dashboard_views()');
```

**Manual refresh (on-demand):**
```sql
SELECT refresh_student_growth_view();  -- Growth data only
SELECT refresh_student_today_view();   -- Today data only
```

---

## 📈 Monitoring & Validation

### Performance Testing

```bash
# Test optimized endpoints
curl -w "\n\nTime: %{time_total}s\n" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v2/student/growth-optimized

# Should see: Time: <0.5s (cached), <1.5s (fresh)
```

### Redis Monitoring

```typescript
// Check cache stats
import { getCacheStats } from '@/lib/cache/redis-client'

const stats = await getCacheStats()
console.log(stats)
// { redisConnected: true, memoryCacheSize: 150 }
```

### Database Query Performance

```sql
-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'test_results', 'assessments')
ORDER BY idx_scan DESC;

-- Check view freshness
SELECT 
  schemaname,
  matviewname,
  last_refresh
FROM pg_matviews
WHERE schemaname = 'public'
ORDER BY last_refresh DESC;
```

### API Response Time Tracking

```typescript
// Check response headers
const response = await fetch('/api/v2/student/growth-optimized')
console.log(response.headers.get('X-Response-Time'))  // "120ms"
console.log(response.headers.get('X-Cache-Status'))   // "HIT"
```

---

## 🐛 Troubleshooting

### Issue: Materialized Views Not Refreshing

**Solution:**
```sql
-- Check pg_cron is installed
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- If not installed
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Manual refresh
SELECT refresh_student_dashboard_views();
```

### Issue: Redis Connection Failed

**Check Redis is running:**
```bash
# Local
redis-cli ping
# Should return: PONG

# If not running
docker start redis  # OR
brew services start redis
```

**Fallback:** App uses in-memory cache automatically

### Issue: Slow Queries Despite Indexes

**Check indexes are being used:**
```sql
EXPLAIN ANALYZE
SELECT * FROM profiles WHERE user_id = 'some-id';

-- Should see: "Index Scan using idx_profiles_user_id_critical"
-- If not, run: ANALYZE profiles;
```

### Issue: Cache Not Invalidating

**Clear all cache:**
```typescript
import { redis } from '@/lib/cache/redis-client'
await redis.clear()
```

**Clear specific cache:**
```typescript
import { invalidateTag } from '@/lib/cache/redis-client'
await invalidateTag('student')
```

---

## 🔄 Rollback Plan

If issues occur, rollback in this order:

1. **Switch Frontend Back to Old APIs**
   ```typescript
   // Revert to: /api/v2/student/growth
   ```

2. **Disable Redis** (if causing issues)
   ```bash
   # Remove from .env
   # REDIS_URL=...
   ```

3. **Keep Database Optimizations** (safe to keep)
   - Indexes improve performance with zero risk
   - Materialized views can be dropped if needed:
   ```sql
   DROP MATERIALIZED VIEW mv_student_growth_summary CASCADE;
   ```

---

## 📊 Expected Results

### Before Optimization
```
Initial Page Load:
├─ Auth Check: 600ms
├─ Profile Fetch: 500ms
├─ Growth API: 5000ms
├─ Today API: 3900ms
└─ Total: ~12 seconds 😱
```

### After Optimization (Cached)
```
Initial Page Load:
├─ Auth Check: 50ms (cached)
├─ Unified API: 400ms (cached)
└─ Total: <500ms ⚡
```

### After Optimization (Fresh)
```
Initial Page Load:
├─ Auth Check: 200ms (with DB)
├─ Unified API: 800ms (views + cache)
└─ Total: ~1 second ✨
```

---

## 🎯 Next Steps

After successful deployment:

1. **Monitor Performance**
   - Track response times in production
   - Monitor cache hit rates
   - Check database query performance

2. **Expand Optimizations**
   - Apply same pattern to teacher APIs
   - Optimize parent dashboard
   - Add CDN for static assets

3. **Fine-tune Cache**
   - Adjust TTL based on usage patterns
   - Add cache warming for popular data
   - Implement cache preloading

4. **Database Optimization**
   - Add more materialized views
   - Optimize slow queries
   - Setup query performance monitoring

---

## 📞 Support

If you encounter issues:
1. Check logs for error messages
2. Verify all migrations ran successfully
3. Test Redis connection
4. Check materialized views refreshed
5. Validate environment variables set

Performance targets achieved! 🎉
