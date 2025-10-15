# 🚨 Database Security Issues Analysis & Remediation

**Analysis Date:** 2025-10-15  
**Source:** Supabase Database Linter  
**Total Issues:** 52 security errors  
**Severity:** CRITICAL - Immediate action required

---

## 📊 Executive Summary

Your database has **3 categories of critical security vulnerabilities**:

1. **RLS policies exist but RLS disabled** (1 table) - Most critical
2. **Security Definer views** (8 views) - High risk
3. **RLS completely disabled** (43 tables) - Critical exposure

**Impact:** Without these fixes, users can potentially:
- Access ANY student's data regardless of relationships
- View private information from other schools
- Bypass all authorization checks
- Read/modify data they shouldn't have access to

---

## 🔥 Issue #1: RLS Policies Exist But RLS Not Enabled (CRITICAL)

### **Table: `student_class_assignments`**

### The Problem:

```sql
-- Current state:
-- ❌ Table has RLS policies defined
-- ❌ BUT RLS is disabled on the table
-- Result: Policies are IGNORED!
```

**What this means:**
You created security policies like:
- "Students can view their own class assignments"
- "Teachers can view class assignments for their classes"
- "Admins can view all student class assignments"

**BUT** these policies are **NOT ENFORCED** because RLS is disabled!

### Example of the Vulnerability:

```typescript
// ❌ CURRENT STATE (VULNERABLE):
// Any authenticated user can run:
const { data } = await supabase
  .from('student_class_assignments')
  .select('*')
  
// Returns: ALL class assignments from ALL students in ALL schools
// Even though you have policies, RLS is OFF so they're ignored!
```

### Why This Happened:

```sql
-- You probably did this:
CREATE POLICY "Students can view their own class assignments"
ON student_class_assignments FOR SELECT
USING (student_id = auth.uid());

-- BUT FORGOT THIS:
ALTER TABLE student_class_assignments ENABLE ROW LEVEL SECURITY;
```

### The Fix:

```sql
-- Step 1: Enable RLS
ALTER TABLE public.student_class_assignments ENABLE ROW LEVEL SECURITY;

-- Step 2: Verify
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'student_class_assignments';
-- Should show: relrowsecurity = true
```

### After Fix:

```typescript
// ✅ AFTER FIX (SECURE):
// Student A queries their assignments
const { data } = await supabase
  .from('student_class_assignments')
  .select('*')

// Returns: Only Student A's assignments
// RLS policies NOW enforced automatically!
```

---

## 🔐 Issue #2: Security Definer Views (HIGH RISK)

### **8 Views Affected:**

1. `attendance_all` ⚠️ **High Risk**
2. `teacher_monthly_stats` ⚠️ **High Risk**
3. `teacher_gem_transactions` ⚠️ **High Risk**
4. `v_unused_indexes` ✅ OK (admin monitoring)
5. `student_messaging_slow_queries` ✅ OK (admin monitoring)
6. `v_index_usage_stats` ✅ OK (admin monitoring)
7. `common_timezones` ✅ OK (public data)
8. `realtime_subscription_stats` ✅ OK (admin monitoring)

### The Problem:

**What is SECURITY DEFINER?**

```sql
-- ❌ VULNERABLE VIEW:
CREATE VIEW attendance_all 
WITH (security_invoker = false) -- This means SECURITY DEFINER
AS SELECT * FROM attendance;
```

**What it does:**
- View runs with **creator's permissions** (usually superuser/admin)
- Ignores **querying user's** permissions
- **Bypasses RLS policies completely**

### Example of the Vulnerability:

```typescript
// Scenario: Student tries to view ALL attendance
const { data } = await supabase
  .from('attendance_all')  // SECURITY DEFINER view
  .select('*')

// ❌ VULNERABLE RESULT:
// Returns: ALL attendance records from ALL students in ALL schools
// Why? View runs as superuser, RLS bypassed

// vs. if they query the table directly:
const { data } = await supabase
  .from('attendance')  // RLS-protected table
  .select('*')

// ✅ SECURE RESULT:
// Returns: Only records they're authorized to see
// Why? RLS policies enforced
```

### Real-World Attack Scenario:

```typescript
// Attacker (student) discovers attendance_all view
// They can now see EVERYONE's attendance:

const { data } = await supabase
  .from('attendance_all')
  .select('*')
  .eq('status', 'absent')
  .order('date', { ascending: false })

// Result: List of ALL absent students across ALL schools
// This is a GDPR violation and privacy breach!
```

### The Fix:

#### Option 1: Remove SECURITY DEFINER (Recommended)

```sql
-- Drop and recreate without SECURITY DEFINER
DROP VIEW IF EXISTS public.attendance_all;

CREATE VIEW public.attendance_all AS
SELECT * FROM public.attendance;
-- Now uses querying user's permissions + RLS
```

#### Option 2: Add Proper WHERE Clause

```sql
-- If you need SECURITY DEFINER, add security checks
DROP VIEW IF EXISTS public.attendance_all;

CREATE VIEW public.attendance_all 
WITH (security_invoker = false) AS
SELECT * FROM public.attendance
WHERE 
  -- Only show records from user's school
  school_id = (
    SELECT school_id FROM profiles 
    WHERE user_id = auth.uid()
  );
```

### Which Views Are Safe to Keep?

| View | Safe? | Reason |
|------|-------|--------|
| `v_unused_indexes` | ✅ Yes | Admin monitoring, no user data |
| `student_messaging_slow_queries` | ✅ Yes | Admin monitoring, no personal info |
| `v_index_usage_stats` | ✅ Yes | Database statistics only |
| `common_timezones` | ✅ Yes | Public read-only reference data |
| `realtime_subscription_stats` | ✅ Yes | System monitoring |
| `attendance_all` | ❌ No | Exposes student attendance data |
| `teacher_monthly_stats` | ❌ No | May expose sensitive teacher data |
| `teacher_gem_transactions` | ❌ No | Exposes financial/transaction data |

---

## 🚪 Issue #3: RLS Completely Disabled (43 Tables)

### The Problem:

**43 tables have NO RLS enabled at all** = Zero protection

### Affected Tables by Category:

#### **Gamification Tables** (High Risk - Student Data)
- `quest_templates`
- `badge_templates`
- `achievement_collections`
- `student_collection_progress`
- `leaderboards`
- `leaderboard_entries`
- `reward_store_items`
- `student_purchases`
- `game_leaderboards`
- `game_leaderboard_entries`
- `game_tournaments`
- `game_collections`
- `game_analytics`

#### **Portfolio Tables** (Critical - Student Personal Data)
- `portfolio_sections`
- `portfolio_goals`
- `portfolio_skills`
- `portfolio_shares`
- `portfolio_templates`
- `portfolio_assignments`
- `portfolio_submissions`

#### **Project Tables** (High Risk - Student Work)
- `project_updates`
- `project_categories`
- `project_category_assignments`
- `project_competitions`
- `project_collaboration_requests`
- `project_mentorships`
- `project_analytics`

#### **Event Tables** (Medium Risk - School Data)
- `event_sessions`
- `event_announcements`
- `event_volunteers`
- `event_competitions`
- `competition_participants`

#### **Study Group Tables** (High Risk - Student Activity)
- `study_group_achievements`
- `study_group_attendance`

#### **System Tables** (Critical - Sensitive Data)
- `audit_logs` - Contains ALL system activity
- `attendance_archive` - Historical attendance
- `attendance_archive_backup` - Backup data
- `exchange_rates` - Financial data

### Example Vulnerability:

```typescript
// ❌ ANY USER can access ANY portfolio:
const { data } = await supabase
  .from('portfolio_sections')
  .select('*, profiles(*)')
  .eq('student_id', 'any-student-id-here')  // Can access ANY student!

// Returns: Complete portfolio of ANY student
// No authorization check whatsoever
```

### Attack Scenario:

```typescript
// Step 1: Attacker lists all students
const { data: students } = await supabase
  .from('profiles')
  .select('id, first_name, last_name')
  .eq('role', 'student')

// Step 2: Steal all their portfolios
for (const student of students) {
  const { data: portfolio } = await supabase
    .from('portfolio_sections')
    .select('*')
    .eq('student_id', student.id)
  
  // Now has EVERYONE's portfolio content!
}

// Step 3: Access purchase history
const { data: purchases } = await supabase
  .from('student_purchases')
  .select('*')
  .order('created_at', { ascending: false })

// Now knows what EVERY student bought with their gems
```

### The Fix Pattern:

#### **1. Enable RLS (First Step)**

```sql
-- Enable on ALL tables
ALTER TABLE public.quest_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_purchases ENABLE ROW LEVEL SECURITY;
-- ... (repeat for all 43 tables)
```

#### **2. Create Appropriate Policies**

##### **Pattern A: Student-Owned Data**

```sql
-- Students can only access their OWN data
CREATE POLICY "Students can manage own portfolio"
ON public.portfolio_sections FOR ALL
TO authenticated
USING (
  student_id = (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);
```

##### **Pattern B: School-Scoped Data**

```sql
-- Users can only see data from their OWN school
CREATE POLICY "Users can view own school leaderboards"
ON public.leaderboards FOR SELECT
TO authenticated
USING (
  school_id = (
    SELECT school_id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);
```

##### **Pattern C: Read-Only Public Data**

```sql
-- Everyone can read, only admins can modify
CREATE POLICY "Templates readable by all authenticated"
ON public.quest_templates FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Templates manageable by admins"
ON public.quest_templates FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);
```

##### **Pattern D: Role-Based Access**

```sql
-- Different access for different roles
CREATE POLICY "Students view own purchases"
ON public.student_purchases FOR SELECT
TO authenticated
USING (
  -- Students see their own
  student_id = (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
  OR
  -- Teachers/admins see all in their school
  EXISTS (
    SELECT 1 FROM profiles p1
    JOIN profiles p2 ON p1.school_id = p2.school_id
    WHERE p1.user_id = auth.uid()
    AND p1.role IN ('teacher', 'admin')
    AND p2.id = student_purchases.student_id
  )
);
```

---

## 🎯 Recommended Policy Matrix

| Table | Who Can Read | Who Can Write | Policy Type |
|-------|--------------|---------------|-------------|
| `portfolio_*` | Owner + Teachers (same school) | Owner only | Student-owned |
| `student_purchases` | Owner + Teachers/Admins | System only | Student-owned |
| `leaderboards` | School members | Admins | School-scoped |
| `audit_logs` | Admins only | System | Admin-only |
| `quest_templates` | All authenticated | Admins | Read-only public |
| `event_*` | School members | Teachers/Admins | School-scoped |
| `study_group_*` | Group members | Group members | Group-based |

---

## 🔍 How to Test Your Fixes

### **Test 1: Cross-Student Access**

```typescript
// Login as Student A
const studentA = await supabase.auth.signInWithPassword({
  email: 'student-a@school.com',
  password: 'password'
})

// Try to access Student B's portfolio
const { data, error } = await supabase
  .from('portfolio_sections')
  .select('*')
  .eq('student_id', 'student-b-id')

// ✅ EXPECTED: error or empty data
// ❌ FAIL: Returns Student B's data
```

### **Test 2: Cross-School Access**

```typescript
// Login as user from School A
const schoolAUser = await supabase.auth.signInWithPassword({
  email: 'user@school-a.com',
  password: 'password'
})

// Try to access School B's leaderboard
const { data, error } = await supabase
  .from('leaderboards')
  .select('*')
  .eq('school_id', 'school-b-id')

// ✅ EXPECTED: error or empty data
// ❌ FAIL: Returns School B's data
```

### **Test 3: Role Enforcement**

```typescript
// Login as student
const student = await supabase.auth.signInWithPassword({
  email: 'student@school.com',
  password: 'password'
})

// Try to modify quest templates
const { error } = await supabase
  .from('quest_templates')
  .update({ title: 'Hacked!' })
  .eq('id', 'some-quest-id')

// ✅ EXPECTED: Permission denied error
// ❌ FAIL: Update succeeds
```

---

## 📋 Implementation Checklist

### **Phase 1: Critical Fixes (Today)**

- [ ] Run `fix_rls_issues.sql` script
- [ ] Enable RLS on `student_class_assignments`
- [ ] Remove SECURITY DEFINER from `attendance_all`
- [ ] Enable RLS on all 43 unprotected tables
- [ ] Verify no errors in Supabase logs

### **Phase 2: Policy Implementation (This Week)**

- [ ] Create policies for portfolio tables
- [ ] Create policies for student purchase tables
- [ ] Create policies for leaderboard tables
- [ ] Create policies for study group tables
- [ ] Create policies for event tables
- [ ] Create policies for project tables
- [ ] Create policies for audit logs

### **Phase 3: Testing (This Week)**

- [ ] Test as student user
- [ ] Test as teacher user
- [ ] Test as admin user
- [ ] Test as parent user
- [ ] Test cross-school access attempts
- [ ] Test cross-student access attempts
- [ ] Check application logs for permission errors

### **Phase 4: Monitoring (Ongoing)**

- [ ] Monitor Supabase logs for RLS errors
- [ ] Set up alerts for failed authorization attempts
- [ ] Review policies monthly
- [ ] Update policies when adding new features
- [ ] Run database linter weekly

---

## ⚠️ Breaking Changes Warning

**These fixes WILL break existing functionality if:**

1. Your application code expects to access all data
2. You query tables directly without filters
3. You use service role key in client-side code
4. Your admin dashboard doesn't specify user context

**Example Breaking Change:**

```typescript
// ❌ THIS WILL BREAK:
// Old code (worked when RLS was disabled)
const allStudents = await supabase
  .from('portfolio_sections')
  .select('*')
// Returns: Nothing (RLS blocks it)

// ✅ FIX:
// New code (works with RLS)
const myPortfolio = await supabase
  .from('portfolio_sections')
  .select('*')
  .eq('student_id', currentUserId)
// Returns: Only current user's portfolio
```

---

## 🚀 Quick Start Commands

```bash
# 1. Run the fix script
psql $DATABASE_URL -f database/security/fix_rls_issues.sql

# 2. Verify RLS enabled
psql $DATABASE_URL -c "
SELECT 
  schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
"

# 3. Check policies
psql $DATABASE_URL -c "
SELECT 
  schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename;
"

# 4. Test in application
npm run dev
# Login as different user types and test access
```

---

## 📞 Support & Troubleshooting

### **Common Error: "new row violates row-level security policy"**

**Problem:** Trying to INSERT/UPDATE data that violates RLS policy

**Solution:**
```sql
-- Check which policy is blocking
SELECT * FROM pg_policies 
WHERE tablename = 'your_table_name';

-- Verify user has proper profile
SELECT * FROM profiles WHERE user_id = auth.uid();
```

### **Common Error: "permission denied for table"**

**Problem:** No SELECT policy exists for user

**Solution:**
```sql
-- Create SELECT policy
CREATE POLICY "Allow select" 
ON your_table FOR SELECT 
TO authenticated 
USING (true);  -- Adjust condition as needed
```

### **Common Error: Empty results but no error**

**Problem:** RLS is working but filtering out all rows

**Solution:** Check if:
- User profile exists and has correct school_id
- User is authenticated (auth.uid() returns value)
- Policy conditions match your data structure

---

## 🎓 Learning Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Security Definer Functions](https://www.postgresql.org/docs/current/sql-createfunction.html)

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-15  
**Next Review:** After implementation (1 week)
