# Redis Caching Strategy Analysis

## 🚫 **NEVER CACHE - Real-Time Critical Data**

### 1. **Attendance Records** ⚠️ CRITICAL
- **Why:** Parents need instant verification of child's school presence
- **APIs:** 
  - `/api/attendance` (GET/POST)
  - `/api/student/attendance-history`
  - `/api/teacher/attendance-history`
  - `/api/teacher/attendance-details`
  - `/api/admin/attendance`
- **Must be:** Direct database queries with <500ms response
- **Parent Use Case:** "Is my child in school right now?" - MUST be instant & accurate

### 2. **Wellbeing/Mood Check-ins**
- **Why:** Real-time mental health monitoring
- **APIs:**
  - `/api/student/mood`
  - `/api/admin/wellbeing-analytics`
  - `/api/student/wellbeing-status`

### 3. **Live Messaging/Communications**
- **Why:** Real-time conversations
- **APIs:**
  - `/api/family-messaging`
  - `/api/communications/messages`
  - `/api/family/messages`

### 4. **Active Help Requests**
- **Why:** Urgent student support needs
- **APIs:**
  - `/api/admin/help-requests`
  - `/api/admin/direct-help-requests`

### 5. **Session/Auth Data**
- **Why:** Security-critical, must be fresh
- **APIs:**
  - `/api/auth/session`
  - `/api/profile` (when checking permissions)

---

## ✅ **HIGH VALUE - Should Cache with Redis**

### 1. **School Configuration** (Cache: 1-24 hours)
**Why:** Changes rarely, accessed frequently
- `/api/admin/school` - School details
- `/api/admin/school-details` - Extended school info
- **Cache Key:** `school:{school_id}:details`
- **TTL:** 6 hours (revalidate on admin updates)
- **Impact:** Reduces 20-50 DB queries/minute

### 2. **Grade Levels** (Cache: 6-12 hours)
**Why:** Static academic structure, rarely changes
- `/api/teacher/grades`
- `/api/admin/grade-levels`
- **Cache Key:** `school:{school_id}:grades`
- **TTL:** 6 hours
- **Current Performance:** 858ms → **<50ms with Redis**

### 3. **Class Assignments** (Cache: 30 minutes)
**Why:** Teacher-class assignments change infrequently
- `/api/teacher/class-assignments`
- **Cache Key:** `teacher:{teacher_id}:classes`
- **TTL:** 30 minutes (invalidate on assignment changes)
- **Current:** Multiple 500ms+ queries
- **With Redis:** <10ms

### 4. **Class Rosters** (Cache: 15 minutes)
**Why:** Student lists per class change only during enrollment
- `/api/classes` - Class list
- `/api/teacher/students` - Students in class
- **Cache Key:** `class:{class_id}:roster`
- **TTL:** 15 minutes
- **Invalidate on:** Student enrollment changes

### 5. **Academic Schedule** (Cache: 24 hours)
**Why:** Bell times, periods, timetables rarely change
- `/api/admin/academic-schedule`
- **Cache Key:** `school:{school_id}:schedule`
- **TTL:** 24 hours

### 6. **User Profile (Read-Only Fields)** (Cache: 10 minutes)
**Why:** Name, email, basic info changes rarely
- `/api/profile` - Profile data (non-sensitive)
- **Cache Key:** `profile:{user_id}:basic`
- **TTL:** 10 minutes
- **Note:** Cache only read-only fields, not permissions

### 7. **School Statistics Dashboard** (Cache: 5 minutes)
**Why:** Aggregate stats don't need second-by-second updates
- `/api/admin/stats`
- `/api/student/dashboard-data`
- `/api/teacher/dashboard-combined`
- **Cache Key:** `stats:{role}:{school_id}:dashboard`
- **TTL:** 5 minutes
- **Current:** 2-4 second queries → **<100ms**

### 8. **Achievement Types & Milestones** (Cache: 1 hour)
**Why:** Achievement definitions are static
- `/api/achievements`
- `/api/achievements/milestones`
- **Cache Key:** `school:{school_id}:achievements:config`
- **TTL:** 1 hour

### 9. **School Events List** (Cache: 10 minutes)
**Why:** Event calendar updates infrequently
- `/api/school-events`
- `/api/school-events/my-events`
- **Cache Key:** `events:{school_id}:upcoming`
- **TTL:** 10 minutes

### 10. **Announcements** (Cache: 5 minutes)
**Why:** Announcements posted occasionally
- `/api/admin/announcements`
- `/api/student/announcements`
- **Cache Key:** `school:{school_id}:announcements:latest`
- **TTL:** 5 minutes
- **Invalidate on:** New announcement creation

---

## 🟡 **MEDIUM VALUE - Cache with Short TTL**

### 1. **Assessment Results** (Cache: 2 minutes)
**Why:** Grades are important but don't change instantly
- `/api/student/assessments`
- `/api/student/grade-analytics`
- **Cache Key:** `student:{student_id}:grades`
- **TTL:** 2 minutes
- **Note:** Clear cache immediately when teacher updates grades

### 2. **XP/Gamification Stats** (Cache: 1 minute)
**Why:** Displayed frequently, updates gradually
- `/api/student/xp-stats`
- `/api/leaderboard`
- **Cache Key:** `student:{student_id}:xp` or `class:{class_id}:leaderboard`
- **TTL:** 60 seconds

### 3. **Peer Tutoring Marketplace** (Cache: 5 minutes)
**Why:** Tutor availability doesn't need real-time
- `/api/peer-tutoring/tutors`
- **Cache Key:** `school:{school_id}:tutors:available`
- **TTL:** 5 minutes

### 4. **Polls (Non-Active)** (Cache: 10 minutes)
**Why:** Completed poll results can be cached
- `/api/polls` - Poll list
- `/api/polls/[id]/analytics` - Results
- **Cache Key:** `poll:{poll_id}:results`
- **TTL:** 10 minutes (active polls should not be cached)

---

## 🔄 **Cache Invalidation Strategies**

### 1. **Time-Based (TTL)**
- Most cached data expires automatically
- Good for data that changes predictably

### 2. **Event-Based Invalidation**
```typescript
// When admin updates school details
await redis.del(`school:${schoolId}:details`)

// When teacher assigns new class
await redis.del(`teacher:${teacherId}:classes`)

// When student enrolls
await redis.del(`class:${classId}:roster`)

// When grades posted
await redis.del(`student:${studentId}:grades`)
```

### 3. **Pattern-Based Invalidation**
```typescript
// Clear all school-related caches
await redis.keys(`school:${schoolId}:*`).then(keys => 
  keys.forEach(key => redis.del(key))
)
```

---

## 📊 **Expected Performance Gains**

| API Endpoint | Current | With Redis | Improvement |
|--------------|---------|------------|-------------|
| `/api/admin/school` | 1.5-2s | <50ms | **40x faster** |
| `/api/teacher/grades` | 858ms | <50ms | **17x faster** |
| `/api/teacher/class-assignments` | 500ms | <10ms | **50x faster** |
| `/api/admin/stats` | 2-4s | <100ms | **20-40x faster** |
| `/api/student/dashboard-data` | 1-2s | <100ms | **10-20x faster** |

---

## 🛠️ **Implementation Priority**

### Phase 1 (Immediate Impact)
1. School details
2. Grade levels
3. Class assignments
4. Dashboard stats

### Phase 2 (High Traffic)
5. Class rosters
6. Profile data
7. Announcements
8. Events

### Phase 3 (Polish)
9. Achievement configs
10. Academic schedule
11. Assessment results
12. XP stats

---

## ⚠️ **Important Notes**

1. **Never cache attendance** - Parents need real-time verification
2. **Never cache sensitive auth/permissions** - Security risk
3. **Never cache live conversations** - Real-time requirement
4. **Always invalidate on writes** - Prevent stale data
5. **Use short TTLs for user-facing data** - Balance speed vs freshness
6. **Monitor cache hit rates** - Adjust strategy based on metrics

---

## 📦 **Redis Key Naming Convention**

```
{entity}:{id}:{data_type}:{optional_specifier}

Examples:
- school:abc123:details
- teacher:xyz789:classes
- class:def456:roster
- student:ghi012:grades
- stats:admin:school123:dashboard
```

---

## 🚀 **Next Steps**

1. Install Upstash Redis
2. Create Redis client utility
3. Implement caching wrapper functions
4. Start with Phase 1 (school, grades, classes, stats)
5. Monitor performance and cache hit rates
6. Gradually expand to Phase 2 and 3
