# Assessment Redis Caching - Setup Guide

## Overview
Dedicated Upstash Redis instance for teacher assessment queries with optimized performance and smart cache invalidation.

## Features
✅ **Dual-Layer Caching**: Redis primary + in-memory fallback  
✅ **Smart TTLs**: Optimized based on data volatility  
✅ **Batch Operations**: MGET and pipeline optimizations  
✅ **Pattern-Based Invalidation**: SCAN for efficient cleanup  
✅ **Auto-Reconnection**: Exponential backoff with circuit breaker  
✅ **Performance Monitoring**: Built-in stats and logging  

## Setup Instructions

### 1. Create Separate Upstash Redis Database

1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database:
   - Name: `catalyst-assessments`
   - Region: Select closest to your primary users
   - Type: Pay-as-you-go (or Free tier for testing)
3. Copy your credentials (see options below)

### 2. Add Environment Variables

You have **TWO options** - choose the one that matches your existing setup:

#### **Option A: REST API Format (Matches Your Parent Cache Setup)**
If you're using `UPSTASH_REDIS_PARENTS_URL` + `UPSTASH_REDIS_PARENTS_TOKEN` pattern:

```bash
# Assessment Redis - REST API Format
UPSTASH_REDIS_ASSESSMENTS_URL=https://tops-caring-cat-12345.upstash.io
UPSTASH_REDIS_ASSESSMENTS_TOKEN=AabBcCdD1234XxYyZz5678...
```

**Where to find:**
- URL: Upstash Console → Your Database → "REST API" section → "UPSTASH_REDIS_REST_URL"
- TOKEN: Same section → "UPSTASH_REDIS_REST_TOKEN"

#### **Option B: Standard Redis URL** 
Alternative format (single variable):

```bash
# Assessment Redis - Standard Format
UPSTASH_ASSESSMENT_REDIS_URL=redis://default:AabBcC123...@eu1-tops-cat-12345.upstash.io:6379
```

**Where to find:**
- Upstash Console → Your Database → Click "Redis Connect" → Copy the URL

**💡 Recommendation:** Use **Option A (REST API)** to match your existing parent cache setup!

### 3. Verify Setup

The system will automatically:
- Connect on first API call
- Fall back to in-memory cache if Redis unavailable
- Log connection status to console

## Cache Strategy

### TTL Configuration
```typescript
ASSESSMENTS_LIST: 900s   // 15 min - teacher's assessment list
ASSESSMENT_DETAIL: 1800s // 30 min - individual assessment
ASSESSMENT_GRADES: 600s  // 10 min - grades for assessment
ASSESSMENT_STATS: 600s   // 10 min - calculated statistics
```

### Cache Keys
```
assessments:list:teacher:{school_id}:{teacher_id}
assessments:detail:{assessment_id}
assessments:grades:{assessment_id}
assessments:stats:{assessment_id}
```

### Invalidation Rules

**On Assessment Creation (POST):**
- Invalidates: `teacher:assessments:{school_id}:{teacher_id}*`

**On Assessment Deletion (DELETE):**
- Invalidates: 
  - `assessment:detail:{assessment_id}`
  - `assessment:grades:{assessment_id}`
  - `assessment:stats:{assessment_id}`
  - `teacher:assessments:{school_id}:{teacher_id}*`

**On Grade Update:**
- Invalidates:
  - `assessment:grades:{assessment_id}`
  - `assessment:stats:{assessment_id}`

## Performance Optimizations

### 1. Connection Pooling
- Keep-alive: 30s
- No Nagle's algorithm (noDelay: true)
- Fast connect timeout: 3s

### 2. Batch Operations
```typescript
// Multi-get for parallel fetches
const assessments = await assessmentRedis.mget<Assessment>(keys)

// Pipeline for bulk operations
pipeline.del(key1)
pipeline.del(key2)
await pipeline.exec()
```

### 3. Efficient Scanning
Uses SCAN instead of KEYS for pattern deletion to avoid blocking:
```typescript
await assessmentRedis.deletePattern('assessments:*')
```

### 4. Dual Storage
- Memory cache = instant reads (0ms)
- Redis cache = distributed (< 10ms typical)
- Always write to both for redundancy

## Monitoring

### Check Cache Stats
```typescript
const stats = await assessmentRedis.getStats()
console.log(stats)
```

### Example Output
```json
{
  "redis": {
    "connected": true,
    "enabled": true,
    "info": "..."
  },
  "memory": {
    "size": 234,
    "maxSize": 500,
    "keys": ["..."]
  }
}
```

### Logs
```
✅ [Assessment Redis] Connected successfully
⚡ [Cache HIT] teacher:assessments:school1:teacher1
❌ [Cache MISS] teacher:assessments:school1:teacher2
🗑️  [Cache] Invalidated assessments for teacher teacher1
```

## Usage in API Routes

```typescript
import { 
  getCachedAssessments,
  getTeacherAssessmentsKey,
  invalidateTeacherAssessments,
  CACHE_TTL 
} from '@/lib/cache/redis-assessments'

// GET with caching
const cacheKey = getTeacherAssessmentsKey(teacherId, schoolId)
const assessments = await getCachedAssessments(
  cacheKey,
  async () => {
    // Fetch from database
    const { data } = await supabase.from('assessments')...
    return data
  },
  CACHE_TTL.ASSESSMENTS_LIST
)

// POST with invalidation
await supabase.from('assessments').insert(...)
await invalidateTeacherAssessments(teacherId, schoolId)
```

## Troubleshooting

### Issue: Redis Not Connecting
**Solution:**
- Verify `UPSTASH_ASSESSMENT_REDIS_URL` is set correctly
- Check Upstash dashboard for database status
- System automatically falls back to memory cache

### Issue: Stale Data
**Solution:**
- Check TTL settings in `CACHE_TTL`
- Verify invalidation is called after mutations
- Clear cache manually: `await assessmentRedis.deletePattern('assessments:*')`

### Issue: High Memory Usage
**Solution:**
- Memory cache limited to 500 entries (auto-eviction)
- Reduce TTL values to expire faster
- Use shorter cache keys

## Performance Benchmarks

Expected performance improvements:
- **Cache Hit**: ~5ms (vs 50-200ms database query)
- **90% reduction** in database load for read-heavy endpoints
- **< 1ms** for memory cache hits
- **Batch operations**: 5-10x faster than individual calls

## Production Checklist

- [ ] Separate Upstash Redis database created
- [ ] `UPSTASH_ASSESSMENT_REDIS_URL` set in production environment
- [ ] `NODE_ENV=production` to enable Redis
- [ ] Monitor cache hit rates in logs
- [ ] Set up alerts for Redis connection failures
- [ ] Review and adjust TTL values based on usage patterns
