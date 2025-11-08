# Daily Topics Not Working - Troubleshooting Guide

## ❌ **Issue:**  
AI responds with: "Okay! To best help you, can you tell me what subjects were covered in class today?"  
Instead of showing: "📚 Today's Class Topics" card

---

## 🔍 **Root Causes (Most Common First):**

### 1. **No Topics Created Yet** (90% of cases)
**Problem:** Teacher hasn't saved any daily topics yet  
**Check:** Run this SQL:
```sql
SELECT COUNT(*) FROM public.daily_topics WHERE topic_date = CURRENT_DATE;
```

**Solution:**
1. Go to `/teacher` dashboard
2. Find "Daily Topics" card
3. Select a class
4. Enter a topic (e.g., "Quadratic Equations")
5. Click "Save Topic"

---

### 2. **Student Has No Class Assigned** (Common)
**Problem:** Student profile has `class_id = NULL`  
**Check:** Run this SQL:
```sql
SELECT user_id, first_name, class_id 
FROM public.profiles 
WHERE role = 'student' 
LIMIT 10;
```

**Solution:** Assign student to a class:
```sql
UPDATE public.profiles
SET class_id = 'YOUR_CLASS_UUID'  -- Get from classes table
WHERE user_id = 'STUDENT_USER_UUID'
AND role = 'student';
```

---

### 3. **Class ID Mismatch**
**Problem:** Topic's `class_id` doesn't match student's `class_id`  
**Check:**
```sql
-- Find student's class
SELECT class_id FROM public.profiles WHERE user_id = 'STUDENT_ID';

-- Check if topics exist for that class
SELECT * FROM public.daily_topics WHERE class_id = 'STUDENT_CLASS_ID' AND topic_date = CURRENT_DATE;
```

**Solution:** Either:
- Create topic for the correct class, OR
- Update student's class_id to match existing topic

---

### 4. **Database Schema Not Applied**
**Problem:** `daily_topics` table doesn't exist  
**Check:**
```sql
SELECT tablename FROM pg_tables WHERE tablename = 'daily_topics';
```

**Solution:** Run migration:
```bash
psql -U postgres -d your_database -f database/migrations/daily_topics_schema.sql
```

---

### 5. **RLS Policy Blocking Access**
**Problem:** Row-Level Security preventing student from seeing topics  
**Check:**
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'daily_topics';

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'daily_topics';
```

**Solution:** Re-run the schema migration to recreate policies

---

## 🧪 **Step-by-Step Testing:**

### **Step 1: Verify Database Setup**
```bash
# Open PSQL or run in Supabase SQL Editor
psql -U postgres -d catalyst

# Run test file
\i database/test_daily_topics.sql
```

### **Step 2: Check Server Logs**
```bash
# In development, check console for:
[Daily Topics] Profile: { userId: '...', role: '...', classId: '...' }
[Daily Topics] Query result: { topicsFound: 0 }
```

If `classId: null` → **Issue #2**  
If `topicsFound: 0` → **Issue #1** or **Issue #3**

### **Step 3: Create Test Data**
```sql
-- 1. Get a teacher ID
SELECT user_id, first_name FROM profiles WHERE role = 'teacher' LIMIT 1;

-- 2. Get a class ID
SELECT id, class_name FROM classes LIMIT 1;

-- 3. Get school ID
SELECT id FROM schools LIMIT 1;

-- 4. Insert test topic
INSERT INTO daily_topics (teacher_id, class_id, school_id, topic, topic_date)
VALUES (
  'teacher-uuid-here',
  'class-uuid-here', 
  'school-uuid-here',
  'Test Topic: Introduction to Algebra',
  CURRENT_DATE
);

-- 5. Assign student to same class
UPDATE profiles 
SET class_id = 'class-uuid-here'
WHERE role = 'student' 
LIMIT 1;
```

### **Step 4: Test API Endpoint**
```bash
# GET student daily topics
curl http://localhost:3000/api/student/daily-topics \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "todayTopics": [
    {
      "topic": "Test Topic: Introduction to Algebra",
      "classes": { "class_name": "Math 101" },
      "profiles": { "first_name": "John", "last_name": "Doe" }
    }
  ],
  "hasTopicsToday": true
}
```

---

## 🎯 **Quick Fix Checklist:**

- [ ] **Run database migration** (`daily_topics_schema.sql`)
- [ ] **Verify table exists** (query #1 in test file)
- [ ] **Check if students have class_id** (query #7)
- [ ] **Create a test topic** as teacher
- [ ] **Verify topic appears** in database (query #6)
- [ ] **Test API endpoint** manually
- [ ] **Check browser console** for errors
- [ ] **Check server logs** for detailed info

---

## 🔧 **Manual Testing Flow:**

### **As Teacher:**
1. Login at `/teacher`
2. Go to "Daily Topics" card
3. Select a class from dropdown
4. Enter: "Test: Linear Equations"
5. Click "Save Topic"
6. Verify success notification

### **As Student:**
1. Login at `/student/homework-helper`
2. Should see "📚 Today's Class Topics" card
3. Should show: "Test: Linear Equations"
4. Click "Ask about this →"
5. Input should auto-fill

---

## 🐛 **Common Error Messages:**

### Error: "No class assigned to student"
**Fix:** Update student profile:
```sql
UPDATE profiles SET class_id = 'CLASS_UUID' WHERE user_id = 'STUDENT_UUID';
```

### Error: "Failed to fetch topics"
**Fix:** Check RLS policies and table permissions

### Error: "You are not assigned to this class" (teacher)
**Fix:** Add teacher to class assignments:
```sql
INSERT INTO teacher_class_assignments (teacher_id, class_id)
VALUES ('TEACHER_UUID', 'CLASS_UUID');
```

### Empty topics array: `[]`
**Fix:** Create at least one topic for today

---

## 📊 **Debugging SQL Queries:**

### Find all students without classes:
```sql
SELECT user_id, first_name, last_name
FROM profiles
WHERE role = 'student' AND class_id IS NULL;
```

### Find topics by date:
```sql
SELECT topic_date, COUNT(*) as topic_count
FROM daily_topics
GROUP BY topic_date
ORDER BY topic_date DESC;
```

### Find class-to-topic mapping:
```sql
SELECT 
  c.class_name,
  COUNT(dt.id) as topics_today
FROM classes c
LEFT JOIN daily_topics dt ON c.id = dt.class_id AND dt.topic_date = CURRENT_DATE
GROUP BY c.id, c.class_name;
```

---

## ✅ **Expected Behavior:**

### **Teacher Dashboard:**
1. Teacher selects class
2. Enters topic
3. Saves (creates or updates today's topic)
4. Topic stored in `daily_topics` table
5. Only ONE topic per class per day (enforced by unique constraint)

### **Student Homework Helper:**
1. Student opens page
2. API fetches topics for student's `class_id` and `topic_date = today`
3. If topics found → Display "📚 Today's Class Topics" card
4. If no topics → Show empty state (no card)
5. AI system prompt includes topics as context

---

## 🚀 **Need More Help?**

Run this comprehensive diagnostic:
```bash
psql -U postgres -d catalyst -f database/test_daily_topics.sql > diagnostic_output.txt
```

Then check `diagnostic_output.txt` for all results.

---

## 📝 **Files to Check:**

1. **API Endpoints:**
   - `/api/student/daily-topics/route.ts` - Student fetch
   - `/api/teacher/daily-topics/route.ts` - Teacher save
   - `/api/student/ai-chat/route.ts` - AI with context

2. **UI Components:**
   - `/components/student/tools/ai-homework-helper.tsx` - Display
   - `/app/(dashboard)/teacher/page.tsx` - Teacher input

3. **Database:**
   - `database/migrations/daily_topics_schema.sql` - Schema
   - `database/test_daily_topics.sql` - Test queries

---

**Most Common Fix:** Create a topic as teacher first, then refresh student page! 🎓
