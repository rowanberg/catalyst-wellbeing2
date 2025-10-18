# Teacher School ID Fix

## Problem

Teacher profiles were missing the `school_id` field, causing the error:
```
Error: School ID not found
at useTeacherData.useCallback[fetchData]
```

This occurred because:
1. Some teacher profiles were created without `school_id` populated
2. The `useTeacherData` hook requires `school_id` to fetch teacher data
3. No fallback mechanism existed to retrieve `school_id` from other sources

## Solution

### 1. Enhanced `/api/profile` Endpoint

**File:** `src/app/api/profile/route.ts`

The profile endpoint now includes a fallback mechanism for teachers:

```typescript
// For teachers without school_id in profile, try to get it from teacher_class_assignments
if (profile.role === 'teacher' && !profile.school_id) {
  // Try with user.id
  const { data: assignment } = await supabase
    .from('teacher_class_assignments')
    .select('school_id')
    .eq('teacher_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .single()
  
  if (assignment?.school_id) {
    // Update profile with found school_id
    await supabase
      .from('profiles')
      .update({ school_id: assignment.school_id })
      .eq('id', user.id)
  } else {
    // Fallback: Try with profile.id
    const { data: assignmentByProfileId } = await supabase
      .from('teacher_class_assignments')
      .select('school_id')
      .eq('teacher_id', profile.id)
      .eq('is_active', true)
      .limit(1)
      .single()
    
    if (assignmentByProfileId?.school_id) {
      // Update profile
      await supabase
        .from('profiles')
        .update({ school_id: assignmentByProfileId.school_id })
        .eq('id', user.id)
    }
  }
}
```

**Benefits:**
- Automatically fixes missing `school_id` on first profile fetch
- Tries both `user_id` and `profile.id` for compatibility
- Updates the profile for future requests (performance optimization)
- Zero impact on non-teacher users

### 2. Improved Error Handling in `useTeacherData`

**File:** `src/hooks/useTeacherData.ts`

Enhanced logging and error messages:

```typescript
if (!schoolId) {
  logger.error('School ID not found in profile', { 
    userId: user.id,
    profileFetched: profileResponse.ok
  })
  throw new Error('School ID not found in profile. Please contact your administrator to assign you to a school.')
}
```

**Benefits:**
- Better error messages for users
- Detailed logging for debugging
- Clear instructions for resolution

### 3. Database Migration

**File:** `database/migrations/fix_teacher_school_id.sql`

Fixes existing teacher profiles:

```sql
UPDATE profiles
SET 
    school_id = tca.school_id,
    updated_at = NOW()
FROM (
    SELECT DISTINCT ON (teacher_id) 
        teacher_id,
        school_id
    FROM teacher_class_assignments
    WHERE is_active = true
    AND school_id IS NOT NULL
    ORDER BY teacher_id, assigned_at DESC
) AS tca
WHERE profiles.role = 'teacher'
AND profiles.school_id IS NULL
AND (profiles.user_id = tca.teacher_id OR profiles.id = tca.teacher_id);
```

**To run the migration:**

```bash
# Using Supabase CLI
supabase db push

# Or execute directly in Supabase SQL Editor
# Copy contents of database/migrations/fix_teacher_school_id.sql
```

## How It Works

### Flow Diagram

```
Teacher Login
    ↓
useTeacherData.fetchData()
    ↓
Fetch /api/profile
    ↓
Profile has school_id?
    ├─ Yes → Return profile
    └─ No  → Check teacher_class_assignments
              ↓
              Found school_id?
              ├─ Yes → Update profile & return
              └─ No  → Return profile without school_id
    ↓
useTeacherData checks school_id
    ├─ Present → Continue
    └─ Missing → Show error message
```

### Compatibility Notes

The fix handles both ID formats:
- **user_id:** UUID from `auth.users` table
- **profile.id:** UUID from `profiles` table

Some `teacher_class_assignments` records use `user_id`, others use `profile.id`, so we check both.

## Testing

### Manual Testing

1. **Test with teacher missing school_id:**
   ```sql
   -- Remove school_id from a test teacher
   UPDATE profiles 
   SET school_id = NULL 
   WHERE role = 'teacher' AND user_id = 'YOUR_TEST_TEACHER_ID';
   ```

2. **Log in as that teacher**
3. **Verify:**
   - No "School ID not found" error
   - Profile automatically updated with school_id
   - Teacher dashboard loads correctly

### Verify Fix in Console

Check browser console for logs:
```
[DEBUG] Profile fetched { userId: '...', hasSchoolId: true }
[DEBUG] Teacher data fetched successfully
```

## Related Files

- `src/app/api/profile/route.ts` - Profile endpoint with fallback
- `src/hooks/useTeacherData.ts` - Teacher data hook
- `database/migrations/fix_teacher_school_id.sql` - Migration script

## Prevention

To prevent this issue in the future:

1. **Always set school_id when creating teacher profiles**
2. **Ensure teacher_class_assignments include school_id**
3. **Run the migration script on production**
4. **Monitor logs for "School ID not found" errors**

## Rollback

If needed, revert changes:

```bash
git checkout HEAD~1 -- src/app/api/profile/route.ts
git checkout HEAD~1 -- src/hooks/useTeacherData.ts
```

## Support

If teachers still see "School ID not found" after this fix:

1. Check if teacher has any class assignments:
   ```sql
   SELECT * FROM teacher_class_assignments 
   WHERE teacher_id = 'TEACHER_USER_ID' AND is_active = true;
   ```

2. If no assignments, create one or assign school_id manually:
   ```sql
   UPDATE profiles 
   SET school_id = 'SCHOOL_ID_HERE' 
   WHERE user_id = 'TEACHER_USER_ID';
   ```

3. Check application logs for detailed error information
