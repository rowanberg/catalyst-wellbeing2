-- =============================================
-- Test Daily Topics Feature
-- =============================================
-- Use this to verify setup and troubleshoot issues
-- =============================================

-- 1. Check if daily_topics table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'daily_topics'
) AS daily_topics_exists;

-- 2. Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'daily_topics';

-- 3. Check all RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'daily_topics';

-- 4. Count total daily topics
SELECT COUNT(*) as total_topics FROM public.daily_topics;

-- 5. Show all topics with class and teacher info
SELECT 
  dt.id,
  dt.topic,
  dt.topic_date,
  dt.class_id,
  c.class_name,
  c.subject,
  p.first_name || ' ' || p.last_name as teacher_name,
  dt.created_at,
  dt.updated_at
FROM public.daily_topics dt
LEFT JOIN public.classes c ON dt.class_id = c.id
LEFT JOIN public.profiles p ON dt.teacher_id = p.user_id
ORDER BY dt.topic_date DESC, dt.updated_at DESC
LIMIT 20;

-- 6. Show today's topics
SELECT 
  dt.topic,
  c.class_name,
  c.subject,
  p.first_name || ' ' || p.last_name as teacher_name
FROM public.daily_topics dt
LEFT JOIN public.classes c ON dt.class_id = c.id
LEFT JOIN public.profiles p ON dt.teacher_id = p.user_id
WHERE dt.topic_date = CURRENT_DATE;

-- 7. Check if students have class_id assigned
SELECT 
  user_id,
  first_name,
  last_name,
  role,
  class_id,
  CASE 
    WHEN class_id IS NULL THEN '❌ NO CLASS'
    ELSE '✅ HAS CLASS'
  END as status
FROM public.profiles
WHERE role = 'student'
LIMIT 10;

-- 8. Test: Insert a sample topic (REPLACE WITH ACTUAL IDs)
-- Uncomment and modify with real IDs to test:
/*
INSERT INTO public.daily_topics (
  teacher_id, 
  class_id, 
  school_id, 
  topic, 
  topic_date
)
VALUES (
  'YOUR_TEACHER_USER_ID',  -- Get from profiles table
  'YOUR_CLASS_ID',         -- Get from classes table
  'YOUR_SCHOOL_ID',        -- Get from schools table
  'Test Topic: Quadratic Equations',
  CURRENT_DATE
)
ON CONFLICT (teacher_id, class_id, topic_date) 
DO UPDATE SET 
  topic = EXCLUDED.topic,
  updated_at = NOW()
RETURNING *;
*/

-- 9. Test: Query as a specific student (REPLACE WITH ACTUAL STUDENT ID)
-- This simulates what the API does
/*
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub":"YOUR_STUDENT_USER_ID"}';

SELECT 
  dt.*,
  c.class_name,
  c.subject,
  p.first_name || ' ' || p.last_name as teacher_name
FROM public.daily_topics dt
JOIN public.classes c ON dt.class_id = c.id
JOIN public.profiles p ON dt.teacher_id = p.user_id
WHERE dt.class_id = (
  SELECT class_id FROM public.profiles WHERE user_id = 'YOUR_STUDENT_USER_ID'
)
AND dt.topic_date = CURRENT_DATE;

RESET role;
*/

-- 10. Find teacher and student IDs for testing
SELECT 
  'TEACHER' as type,
  user_id,
  first_name,
  last_name,
  school_id
FROM public.profiles
WHERE role = 'teacher'
LIMIT 5;

SELECT 
  'STUDENT' as type,
  user_id,
  first_name,
  last_name,
  school_id,
  class_id
FROM public.profiles
WHERE role = 'student'
LIMIT 5;

-- 11. Find classes
SELECT 
  id as class_id,
  class_name,
  subject,
  grade_level_id,
  school_id
FROM public.classes
LIMIT 10;

-- =============================================
-- Common Issues & Solutions
-- =============================================

-- ISSUE 1: "Today's Topics" not showing
-- SOLUTION: Check if:
--   a) Student has class_id assigned (query #7)
--   b) Topics exist for today (query #6)
--   c) Topic's class_id matches student's class_id
--   d) RLS policies allow student access (query #3)

-- ISSUE 2: Teacher can't save topics
-- SOLUTION: Check if:
--   a) Teacher is assigned to the class (teacher_class_assignments table)
--   b) All required fields are provided (teacher_id, class_id, school_id, topic)
--   c) Topic length is between 3-1000 characters

-- ISSUE 3: Duplicate topics
-- SOLUTION: This shouldn't happen due to unique constraint
--   The constraint ensures one topic per (teacher_id, class_id, topic_date)

-- ISSUE 4: Old topics not cleaning up
-- SOLUTION: Run the cleanup function manually:
--   SELECT cleanup_old_daily_topics();
--   (Deletes topics older than 30 days)

-- =============================================
-- Quick Fix: Assign class_id to student
-- =============================================
-- If student has no class_id, assign one:
/*
UPDATE public.profiles
SET class_id = 'YOUR_CLASS_ID'
WHERE user_id = 'YOUR_STUDENT_USER_ID'
AND role = 'student';
*/
