# Debugging AI Assistant Data Issues

## Problem
AI Assistant showing zero data for all metrics despite database containing data.

## Added Debugging

### Error Logging (Line 159-168)
```typescript
if (schoolResult.error) console.error('❌ School query error:', schoolResult.error)
if (studentsResult.error) console.error('❌ Students query error:', studentsResult.error)
// ... etc for all queries
```

### Data Count Logging (Line 182-193)
```typescript
console.log('📊 Data fetched:', {
  school: school?.name || 'Not found',
  students: students.length,
  teachers: teachers.length,
  // ... etc
})
```

## How to Debug

### 1. Send Test Request
1. Navigate to `http://localhost:3000/admin/ai-assistant`
2. Send any message (e.g., "How many students do we have?")
3. Check the terminal/console where Next.js is running

### 2. Check Server Logs
Look for:
```
📊 Data fetched: {
  school: 'JEBIN PUBLIC SCHOOL',
  students: 0,    // ← Should show actual count
  teachers: 0,    // ← Should show actual count
  grades: 0,      // ← Should show actual count
  ...
}
```

### 3. Common Issues

#### Issue A: Permission Errors
**Symptoms:**
```
❌ Students query error: { code: 'PGRST116', message: 'permission denied' }
```

**Solution:** Check RLS policies on tables:
- `profiles` table needs SELECT policy for admin users
- `grades` table needs SELECT policy
- `attendance` table needs SELECT policy
- etc.

#### Issue B: Wrong school_id
**Symptoms:**
```
📊 Data fetched: { school: 'Not found', students: 0, ... }
```

**Solution:** Verify admin profile has correct `school_id`:
```sql
SELECT user_id, role, school_id FROM profiles WHERE role = 'admin';
```

#### Issue C: Date Filtering Too Restrictive
**Symptoms:**
```
📊 Data fetched: { ..., attendance: 0, wellbeing: 0 }
```

**Solution:** Check if data is older than filter ranges:
- Attendance: Last 90 days
- Wellbeing: Last 6 months
- Achievements: Last 30 days

#### Issue D: Table Schema Mismatch
**Symptoms:**
```
❌ Grades query error: { message: 'column "grade_type" does not exist' }
```

**Solution:** Update query to match actual schema.

## Quick Test Queries

Run these in Supabase SQL Editor to verify data exists:

```sql
-- Check students
SELECT COUNT(*) FROM profiles 
WHERE role = 'student' 
AND school_id = 'f2baa26b-ad79-4576-bead-e57dc942e4f8';

-- Check grades
SELECT COUNT(*) FROM grades 
WHERE school_id = 'f2baa26b-ad79-4576-bead-e57dc942e4f8';

-- Check attendance
SELECT COUNT(*) FROM attendance 
WHERE school_id = 'f2baa26b-ad79-4576-bead-e57dc942e4f8';

-- Check assessments
SELECT COUNT(*) FROM assessments 
WHERE school_id = 'f2baa26b-ad79-4576-bead-e57dc942e4f8';
```

## Next Steps After Debugging

1. **Share console output** - Copy the `📊 Data fetched` log
2. **Share error messages** - Copy any `❌` error logs
3. **Check RLS policies** - Verify admin users can SELECT from all tables
4. **Verify school_id** - Confirm it matches across all tables
