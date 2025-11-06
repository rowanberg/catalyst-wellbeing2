# Catalyst Backend Systems & Integration Architecture

**Complete Technical Documentation**  
**Platform**: Next.js 15 + Supabase + AI/ML Integration  
**Last Updated**: November 2025

---

## 1. SYSTEM ARCHITECTURE

### Tech Stack
- **Frontend**: Next.js 15.5.2, React 19, TypeScript, Tailwind, Framer Motion, Redux Toolkit
- **Backend**: Next.js API Routes (200+ endpoints), Supabase Edge Functions
- **Database**: PostgreSQL 15 (Supabase), 80+ tables, Row Level Security
- **AI/ML**: Google Gemini (4 model families, 100+ API keys)
- **Real-time**: Supabase Realtime, WebSockets
- **Deployment**: Netlify, Vercel, Android APK (Capacitor), PWA

### Architecture Layers
```
Client (Next.js + PWA + Android)
    ↓
API Layer (200+ REST endpoints + Server Actions)
    ├─ /api/student/* (52)
    ├─ /api/teacher/* (66)
    ├─ /api/admin/* (35)
    ├─ /api/parent/* (1)
    ├─ /api/v1/* (7)
    └─ /api/v2/* (10)
    ↓
Supabase Edge Functions
    ├─ intelligent-ai-router
    ├─ get-available-gemini-key
    └─ reset-cooldowns
    ↓
PostgreSQL Database (80+ tables, RLS, pg_cron)
```

---

## 2. AI/ML INTEGRATION - Multi-Model Intelligent Router

### 2.1 Model Families (100+ API Keys)

| Model | RPM | RPD | TPM | Priority | Table |
|-------|-----|-----|-----|----------|-------|
| Gemini 2.5 Flash Lite | 15 | 1,000 | 250K | 1 | `gemini_25_flash_lite_keys` |
| Gemini 2.5 Flash | 10 | 250 | 250K | 2 | `gemini_25_flash_keys` |
| Gemini 2.0 Flash Lite | 30 | 200 | 1M | 3 | `gemini_20_flash_lite_keys` |
| Gemini Flash 2 | 15 | 1,500 | 1M | 4 | `gemini_api_keys` |

### 2.2 Key Features
✅ 100+ key management across 4 model families  
✅ Intelligent fallback (auto-switch when rate-limited)  
✅ Real-time quota tracking (RPM/RPD/TPM per key)  
✅ Token-aware key selection  
✅ Row-level locking (prevent race conditions)  
✅ Cooldown management with auto-recovery  
✅ Complete audit trail in `api_usage_logs`  
✅ AES-256-GCM encryption for API keys

### 2.3 Fallback Chain
```
Request Gemini 2.5 Flash Lite
  ↓ (all keys exhausted)
Fallback to Gemini 2.5 Flash
  ↓ (all keys exhausted)
Fallback to Gemini 2.0 Flash Lite
  ↓ (all keys exhausted)
Fallback to Gemini Flash 2
  ↓ (all keys exhausted)
Return 429 Rate Limit Error
```

### 2.4 Edge Function: intelligent-ai-router

**Request**:
```json
POST /functions/v1/intelligent-ai-router
{
  "model": "gemini-2.5-flash-lite",
  "tokens": 1500,
  "userId": "uuid",
  "endpoint": "/api/chat"
}
```

**Response**:
```json
{
  "success": true,
  "api_key": "decrypted-key",
  "model_used": "gemini-2.5-flash-lite",
  "fallback_count": 0,
  "usage": {
    "current_rpm": 3,
    "current_rpd": 45,
    "current_tpm": 4500
  },
  "request_duration_ms": 125
}
```

### 2.5 Encryption System (AES-256-GCM)
```typescript
// Format: iv:authTag:encrypted
// Encrypted key storage in database
// Decryption via Web Crypto API in Edge Functions
// Key: 64-char hex string (32 bytes) in Supabase Secrets
```

### 2.6 Automated Jobs (pg_cron)
```sql
-- Reset RPM every minute
'* * * * *' → reset_all_rpm_counters()

-- Reset RPD daily at midnight
'0 0 * * *' → reset_all_rpd_counters()

-- Clear cooldowns every 5 minutes
'*/5 * * * *' → clear_expired_cooldowns()
```

### 2.7 User AI Quota System

**Normal Quota**: 30 free Gemini 2.0 Flash requests/day  
**Extra Quota**: 500 Gemma requests/day (27b → 12b → 4b cascade)

**Tables**:
- `user_ai_quotas` - Daily usage tracking
- `ai_request_logs` - Complete request history

**Quota Check Flow**:
1. Get/create quota record
2. Check if daily reset needed
3. Determine available quota (normal vs extra)
4. Increment usage counters
5. Log request details

### 2.8 Admin AI Assistant (School Intelligence)

**10 Parallel Data Sources**:
1. School info (name, timezone, settings)
2. Students (gender, DOB, grade, section)
3. Teachers (all staff)
4. Parents (all guardians)
5. Grades (subject, type, remarks)
6. Attendance (90-day history)
7. Wellbeing (6-month mood tracking)
8. Assessments (scores, due dates)
9. Announcements (last 20)
10. Achievements (30-day history)

**Analytics Generated**:
- Population metrics (ratios, counts)
- Class structure breakdown
- Gender demographics with percentages
- 90-day attendance rates
- Subject-wise academic averages
- Wellbeing scores and trends
- Assessment completion rates
- Achievement statistics

**AI Context**: All analytics embedded in system prompt for data-driven responses.

---

## 3. API ARCHITECTURE (200+ Endpoints)

### 3.1 API Organization
```
/api/student/*     - 52 endpoints (dashboard, grades, achievements, wallet)
/api/teacher/*     - 66 endpoints (students, attendance, quests, badges)
/api/admin/*       - 35 endpoints (users, analytics, help-requests)
/api/parent/*      - 1 endpoint (dashboard)
/api/v1/*          - 7 endpoints (parent portal v1)
/api/v2/*          - 10 endpoints (optimized student APIs)
/api/superpanel/*  - 6 endpoints (multi-school management)
/api/auth/*        - 2 endpoints (authentication)
/api/chat/*        - 2 endpoints (AI chat systems)
/api/communications/* - 5 endpoints (messaging)
/api/examination/* - 2 endpoints (exam generation)
/api/study-groups/* - 4 endpoints (collaborative learning)
/api/school-events/* - 3 endpoints (event management)
/api/polls/*       - 3 endpoints (surveys)
[+ 40 common/shared endpoints]
```

### 3.2 Standard Patterns

**Success Response**:
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "timestamp": "2025-11-03T14:23:45Z"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {},
  "timestamp": "2025-11-03T14:23:45Z"
}
```

### 3.3 Authentication Flow
```typescript
1. Create Supabase client with cookies
2. Get authenticated user
3. Fetch user profile with role
4. Verify role permissions
5. Execute business logic
6. Return response with caching headers
```

### 3.4 Caching Strategy

**Route Segment Config**:
```typescript
export const dynamic = 'force-dynamic'  // No static generation
export const revalidate = 60            // Cache 60 seconds
```

**Memory Cache**: In-memory LRU cache (1000 items max, TTL-based expiration)  
**Profile Cache**: 5-minute TTL with request deduplication  
**API Response Cache**: Next.js built-in with revalidate periods

### 3.5 Performance Optimizations

✅ Parallel queries (Promise.all)  
✅ Database indexes on all foreign keys  
✅ Pagination (50 items/page)  
✅ Request deduplication  
✅ Profile caching service  
✅ Optimized JOINs  
✅ Connection pooling

**Key Indexes**:
```sql
idx_profiles_user_id, idx_profiles_school_id, idx_profiles_role
idx_attendance_student_date, idx_grades_student_id
idx_achievements_student_id, idx_classes_school_id
```

---

## 4. DATABASE SCHEMA (80+ Tables)

### 4.1 Core Tables

**Authentication & Users**:
- `auth.users` (Supabase managed)
- `profiles` (extended user data with role)

**Schools**:
- `schools` (school information)
- `school_settings` (preferences, policies)

**Academic Structure**:
- `grade_levels` (grades 1-12 + sections)
- `classes` (class rosters)
- `subjects` (subject definitions)

**Student Data**:
- `student_class_assignments` (student-class mapping)
- `grades` (academic performance)
- `attendance` (daily attendance records)

**Assessments**:
- `assessments` (exams, quizzes, tests)
- `assessment_grades` (individual scores)

**Wellbeing**:
- `student_wellbeing` (mood tracking)
- `gratitude_entries` (gratitude journal)
- `courage_log` (courage tracking)
- `kindness_counter` (kindness acts)
- `affirmation_sessions` (affirmation practice)
- `habits_tracker` (daily habits)

**Gamification**:
- `student_achievements` (badges, XP)
- `student_progress` (levels, ranks)
- `student_quests` (educational quests)
- `student_wallet` (gems balance)
- `wallet_transactions` (transaction history)

**Communication**:
- `announcements` (school-wide messages)
- `communications` (direct messages)
- `community_posts` (social feed)
- `post_reactions` (likes, reactions)
- `help_requests` (student support tickets)

**Events & Calendar**:
- `academic_schedule` (school calendar)
- `school_events` (events management)
- `event_registrations` (attendance tracking)

**Collaborative**:
- `study_groups` (group learning)
- `study_group_members` (membership)
- `study_group_join_requests` (approval system)
- `peer_tutoring_sessions` (tutoring marketplace)

**Staff**:
- `teacher_class_assignments` (teacher-class mapping)
- `teacher_settings` (preferences)

**AI Systems**:
- `gemini_25_flash_lite_keys` (100+ keys)
- `gemini_25_flash_keys`
- `gemini_20_flash_lite_keys`
- `gemini_api_keys` (legacy)
- `api_usage_logs` (complete audit trail)
- `user_ai_quotas` (daily quotas)
- `ai_request_logs` (request history)

**Parent Portal**:
- `parent_child_relationships` (family links)
- `parent_notifications` (alert settings)

**Admin**:
- `academic_upgrade_mappings` (year-end promotion)
- `sel_programs` (wellbeing programs)
- `school_goals` (institutional goals)
- `polls` (surveys & voting)

**Analytics**:
- `analytics_events` (user activity tracking)
- `user_sessions` (session management)

### 4.2 Row Level Security (RLS)

**Enabled on all tables**:
- Students: Can only see own data
- Teachers: Can see assigned class data
- Admin: Can see school-wide data
- Parent: Can see linked children data
- Super Admin: Bypass all RLS via admin client

**Example RLS Policy**:
```sql
CREATE POLICY "Students can view own grades"
ON grades FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view class grades"
ON grades FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM teacher_class_assignments
    WHERE teacher_id = auth.uid()
    AND class_id = grades.class_id
  )
);
```

---

## 5. AUTHENTICATION & AUTHORIZATION

### 5.1 Auth System (Supabase Auth)

**Providers**: Email/Password, Magic Link, OAuth (Google, Microsoft)  
**Features**: Email verification, password reset, session management, 2FA

**Session Management**:
- JWT tokens (1 hour expiry)
- Refresh tokens (30 days)
- Auto-refresh on client
- Secure HTTP-only cookies

### 5.2 Role-Based Access Control

**Roles**: `student`, `teacher`, `admin`, `parent`, `super_admin`

**Permission Matrix**:
```
Feature              | Student | Teacher | Admin | Parent | Super Admin
---------------------|---------|---------|-------|--------|------------
View own data        |    ✓    |    ✓    |   ✓   |   ✓    |      ✓
View class data      |    ✗    |    ✓    |   ✓   |   ✗    |      ✓
View school data     |    ✗    |    ✗    |   ✓   |   ✗    |      ✓
Manage users         |    ✗    |    ✗    |   ✓   |   ✗    |      ✓
Access AI assistant  |    ✓    |    ✗    |   ✓   |   ✗    |      ✗
Manage API keys      |    ✗    |    ✗    |   ✗   |   ✗    |      ✓
```

### 5.3 UnifiedAuthGuard

**Client-side protection**:
```typescript
<UnifiedAuthGuard requiredRole="teacher">
  <TeacherDashboard />
</UnifiedAuthGuard>
```

**Features**:
- Automatic redirect to login
- Role verification
- Loading states
- Error handling

---

## 6. REAL-TIME SYSTEMS

### 6.1 Supabase Realtime

**Subscriptions**:
- Live attendance updates
- Real-time grade posting
- Instant messaging
- Announcement broadcasts
- Activity feed updates

**Implementation**:
```typescript
const channel = supabase
  .channel('attendance-updates')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'attendance'
    },
    (payload) => {
      updateAttendanceUI(payload.new)
    }
  )
  .subscribe()
```

### 6.2 WebSocket Client

**Location**: `src/lib/websocket-client.ts`  
**Features**: Auto-reconnect, heartbeat, message queuing

---

## 7. SECURITY SYSTEMS

### 7.1 Encryption

**API Keys**: AES-256-GCM encryption  
**Sensitive Data**: Field-level encryption for PII  
**Passwords**: Bcrypt hashing (Supabase managed)

### 7.2 Input Validation

**Zod Schemas**: All API inputs validated  
**SQL Injection Protection**: Parameterized queries only  
**XSS Protection**: React automatic escaping + CSP headers

### 7.3 Rate Limiting

**AI Endpoints**: 30 normal + 45 extra requests/day per user  
**API Endpoints**: Supabase built-in rate limiting  
**Login Attempts**: 5 attempts per 15 minutes

### 7.4 Audit Logging

**Tables**: `api_usage_logs`, `analytics_events`  
**Data**: User actions, API calls, data changes, security events

---

## 8. THIRD-PARTY INTEGRATIONS

### 8.1 Google Gemini AI
- 4 model families
- 100+ API keys
- Intelligent routing
- Fallback system

### 8.2 Supabase
- PostgreSQL database
- Authentication
- Realtime subscriptions
- Storage (avatars, documents)
- Edge Functions

### 8.3 Payment Systems (Planned)
- Stripe integration for subscriptions
- Gems purchase system

### 8.4 Email Services
- Supabase Email (auth emails)
- Custom SMTP for notifications

### 8.5 SMS (Optional)
- Twilio for SMS notifications
- OTP verification

---

## 9. DEPLOYMENT & INFRASTRUCTURE

### 9.1 Hosting

**Primary**: Netlify  
**Alternative**: Vercel  
**Database**: Supabase (managed PostgreSQL)  
**Edge Functions**: Supabase Edge Runtime

### 9.2 Build Process

```bash
npm run build          # Production build
npm run dev            # Development server
npm run lint           # ESLint
npm run test           # Jest tests
```

### 9.3 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Keys
GEMINI_ENCRYPTION_KEY=        # 64-char hex
API_KEY_ENCRYPTION_KEY=       # 64-char hex

# App Config
NEXT_PUBLIC_APP_URL=
NODE_ENV=production
```

### 9.4 PWA Configuration

**manifest.json**: App name, icons, theme colors  
**Service Worker**: Offline caching, push notifications  
**Install Prompt**: Custom install UI

### 9.5 Android APK

**Capacitor Config**: Native app wrapper  
**Build**: `npx cap sync android && npx cap open android`  
**Features**: Native features, offline support, app store distribution

---

## 10. MONITORING & ANALYTICS

### 10.1 Performance Monitoring

- API response times logged
- Database query performance
- Cache hit/miss rates
- Error tracking

### 10.2 Usage Analytics

- User activity tracking
- Feature usage statistics
- Engagement metrics
- Retention analysis

### 10.3 AI Usage Tracking

- Model usage distribution
- Fallback frequency
- Token consumption
- Cost analysis

---

## SUMMARY

**API Endpoints**: 200+  
**Database Tables**: 80+  
**AI Models**: 4 families, 100+ keys  
**Real-time Channels**: 10+ subscription types  
**Authentication**: Multi-provider with RLS  
**Caching**: Multi-layer (memory, API, profile)  
**Security**: Encryption, validation, audit logs  
**Deployment**: PWA + Web + Android APK  
**Performance**: Parallel queries, indexes, deduplication  
**Monitoring**: Complete logging and analytics
