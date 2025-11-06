# Teacher API - Critical ID Mismatch Fix

## **Issue Discovered**

The `teacher_class_assignments` table uses `user_id` (from auth.users), but the fixed endpoints were using `profile.id` causing **zero results** for all teacher queries.

**Log Evidence:**
```
API called for teacher: c7a9ce2b-d359-4257-9e0b-afe5b02faa6f  ← profile.id
Raw assignments found: 0  ← No results!
```

But frontend passes:
```
?teacher_id=641bb749-58ed-444e-b39c-984e59a93dd7  ← user.id (correct)
```

---

## **Root Cause**

Database foreign keys use `user_id`:
```sql
teacher_class_assignments.teacher_id → profiles.user_id
gem_transactions.teacher_id → profiles.user_id
black_marks.teacher_id → profiles.user_id
```

But endpoints were using:
```typescript
const teacherId = teacherProfile.id  // ❌ Wrong - this is profile.id
```

---

## **Fixed Endpoints**

All now use `user.id`:

```typescript
const teacherId = user.id  // ✅ Correct - matches foreign keys
```

1. ✅ `/api/teacher/assigned-classes`
2. ✅ `/api/teacher/dashboard-analytics`
3. ✅ `/api/teacher/dashboard-combined`
4. ✅ `/api/teacher/classes`
5. ✅ `/api/teacher/grades`

---

## **Testing**

After fix, logs should show:
```
API called for teacher: 641bb749-58ed-444e-b39c-984e59a93dd7
Raw assignments found: 5  ← Results found!
```

---

## **Key Takeaway**

**ALWAYS use `user.id` for foreign key relationships, NOT `profile.id`.**

Profiles table schema:
- `id` = UUID (profile primary key)
- `user_id` = UUID (references auth.users.id) ← Use this for FK relationships
