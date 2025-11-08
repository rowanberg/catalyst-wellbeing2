# 🪑 Easy Seating Fix - One Script

## Problem
Students have seats assigned but "My Seat" button shows "No class assignment found"

## Root Cause
The `class_id` in `student_class_assignments` doesn't match the actual classes in your database.

---

## ✅ Simple Fix (One Script)

### Run this in Supabase SQL Editor:
```bash
database/SIMPLE_FIX.sql
```

This script will:
1. ✅ Show which class_id is wrong
2. ✅ Show your actual classes
3. ✅ **Automatically fix** the mismatch
4. ✅ Verify all students are correctly linked

---

## 🎯 What It Does

The script updates `student_class_assignments` to use the **correct class_id** from your seating chart:

```sql
student_class_assignments.class_id = (correct class from seating_charts)
```

---

## 🧪 Test After Running

1. Refresh student dashboard
2. Click "My Seat" button on Profile tab
3. See your seat! (e.g., "Your Seat: A2 ✓")

---

## ⚡ That's It!

No manual updates needed. The script finds the correct class from your seating chart and updates everything automatically.

**Run SIMPLE_FIX.sql and you're done!** 🎉
