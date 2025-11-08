-- =============================================
-- MANUAL TEST SETUP - Copy/Paste into Supabase SQL Editor
-- =============================================
-- Use this if you don't have command-line access
-- Run each section ONE AT A TIME in order
-- =============================================

-- ============================================= 
-- SECTION 1: Check Current State
-- ============================================= 
-- Run this first to see what you have

SELECT 'Teachers' as type, user_id, first_name, last_name, school_id
FROM profiles WHERE role = 'teacher' LIMIT 3;

SELECT 'Students' as type, user_id, first_name, last_name, class_id, school_id
FROM profiles WHERE role = 'student' LIMIT 3;

SELECT 'Today''s Topics' as type, COUNT(*) as count
FROM daily_topics WHERE topic_date = CURRENT_DATE;

-- ============================================= 
-- SECTION 2: Create Test Topic
-- ============================================= 
-- IMPORTANT: Get teacher_id from SECTION 1 output above
-- Replace 'YOUR-TEACHER-UUID-HERE' with actual teacher ID

INSERT INTO daily_topics (
  teacher_id,
  class_id,
  school_id,
  topic,
  topic_date
)
VALUES (
  'YOUR-TEACHER-UUID-HERE',           -- ⚠️ REPLACE THIS
  '39b2f519-c0d1-4915-8773-36a9254f7016',  -- jebin class
  'f2baa26b-ad79-4576-bead-e57dc942e4f8',  -- your school
  'Introduction to Quadratic Equations',
  CURRENT_DATE
)
ON CONFLICT (teacher_id, class_id, topic_date)
DO UPDATE SET
  topic = EXCLUDED.topic,
  updated_at = NOW()
RETURNING *;

-- ============================================= 
-- SECTION 3: Assign Student to Class
-- ============================================= 
-- IMPORTANT: Get student user_id from SECTION 1 output
-- Replace 'YOUR-STUDENT-UUID-HERE' with actual student ID

UPDATE profiles
SET class_id = '39b2f519-c0d1-4915-8773-36a9254f7016'  -- jebin class
WHERE user_id = 'YOUR-STUDENT-UUID-HERE'  -- ⚠️ REPLACE THIS
AND role = 'student'
RETURNING user_id, first_name, last_name, class_id;

-- ============================================= 
-- SECTION 4: Verify Setup
-- ============================================= 
-- Run this to confirm everything is working

-- Check topic exists
SELECT 
  dt.topic,
  dt.topic_date,
  c.class_name,
  p.first_name || ' ' || p.last_name as teacher_name
FROM daily_topics dt
JOIN classes c ON dt.class_id = c.id
JOIN profiles p ON dt.teacher_id = p.user_id
WHERE dt.topic_date = CURRENT_DATE;

-- Check student has class
SELECT 
  first_name,
  last_name,
  class_id,
  CASE 
    WHEN class_id IS NOT NULL THEN '✅ HAS CLASS'
    ELSE '❌ NO CLASS'
  END as status
FROM profiles
WHERE role = 'student'
LIMIT 5;

-- ============================================= 
-- SECTION 5: Test Student Query
-- ============================================= 
-- This simulates what the API does
-- Replace 'YOUR-STUDENT-UUID-HERE' with actual student ID

SELECT 
  dt.topic,
  dt.topic_date,
  c.class_name,
  c.subject,
  p.first_name || ' ' || p.last_name as teacher_name
FROM daily_topics dt
JOIN classes c ON dt.class_id = c.id
JOIN profiles p ON dt.teacher_id = p.user_id
WHERE dt.class_id = (
  SELECT class_id FROM profiles WHERE user_id = 'YOUR-STUDENT-UUID-HERE'  -- ⚠️ REPLACE THIS
)
AND dt.topic_date = CURRENT_DATE;

-- If this returns rows, the feature will work! ✅

-- ============================================= 
-- QUICK REFERENCE: Your Class IDs
-- ============================================= 
/*
Available classes from your data:

1. jebin                         → 39b2f519-c0d1-4915-8773-36a9254f7016
2. diamond rangers               → 48c64872-22bf-49c8-aad2-d3cff4758c3b
3. GOLD 4TH                      → 74736923-00df-4bac-8a48-99e2292a9e39
4. Kindergarten - Class A        → b2f1c224-ed29-4cb4-9a04-ef10e223a58e
5. First Grade - Class A         → e1536b74-f47f-460d-b8bb-d5c08ceca13f
6. Second Grade - Class A        → b1b2d21c-3375-4312-aebe-5113b62924a9
7. Third Grade - Mathematics     → f90a5114-04d5-4312-be9e-1ee7b4b23a89
8. 🤗🤗🤗🤗🤗🤗                      → 3fe71a6f-88e4-4c93-8504-0bb569519026
9. Fourth Grade - Mathematics    → ff2d5fca-c2ff-4fc7-95af-4b243b71443a
10. Fifth Grade - Mathematics    → c71fb906-d0da-4c25-9a86-8a8305905875

School ID: f2baa26b-ad79-4576-bead-e57dc942e4f8
*/
