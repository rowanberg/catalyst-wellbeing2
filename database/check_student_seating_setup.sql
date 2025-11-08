-- Check Student Seating Setup
-- Run this to diagnose why a student can't see their seating arrangement

-- 1. Check if student exists in profiles
SELECT 
  'Student Profile' as check_name,
  id,
  user_id,
  first_name,
  last_name,
  role,
  class_id
FROM profiles 
WHERE role = 'student'
LIMIT 5;

-- 2. Check class_students table (most common)
SELECT 
  'Class Students Table' as check_name,
  cs.student_id,
  cs.class_id,
  p.first_name,
  p.last_name,
  c.name as class_name
FROM class_students cs
LEFT JOIN profiles p ON p.id = cs.student_id
LEFT JOIN classes c ON c.id = cs.class_id
LIMIT 5;

-- 3. Check if student_classes table exists (alternative naming)
SELECT 
  'Student Classes Table' as check_name,
  COUNT(*) as record_count
FROM information_schema.tables 
WHERE table_name = 'student_classes';

-- 4. Check active seating charts
SELECT 
  'Active Seating Charts' as check_name,
  sc.id,
  sc.class_id,
  sc.layout_name,
  sc.is_active,
  c.name as class_name,
  COUNT(sa.id) as assigned_seats
FROM seating_charts sc
LEFT JOIN classes c ON c.id = sc.class_id
LEFT JOIN seat_assignments sa ON sa.seating_chart_id = sc.id
WHERE sc.is_active = true
GROUP BY sc.id, sc.class_id, sc.layout_name, sc.is_active, c.name;

-- 5. Check seat assignments for students
SELECT 
  'Seat Assignments' as check_name,
  sa.seat_id,
  sa.row_index,
  sa.col_index,
  p.first_name,
  p.last_name,
  c.name as class_name
FROM seat_assignments sa
LEFT JOIN profiles p ON p.id = sa.student_id
LEFT JOIN seating_charts sc ON sc.id = sa.seating_chart_id
LEFT JOIN classes c ON c.id = sc.class_id
LIMIT 10;

-- 6. Check for orphaned students (in profiles but not in class_students)
SELECT 
  'Orphaned Students' as check_name,
  p.id,
  p.first_name,
  p.last_name,
  p.class_id as profile_class_id
FROM profiles p
LEFT JOIN class_students cs ON cs.student_id = p.id
WHERE p.role = 'student' 
  AND cs.student_id IS NULL
LIMIT 10;

-- 7. Full diagnostic for a specific student (replace with actual user_id)
-- SELECT 
--   'Student Full Diagnostic' as check_name,
--   p.id as profile_id,
--   p.user_id,
--   p.first_name,
--   p.last_name,
--   p.class_id as profile_class_id,
--   cs.class_id as class_students_class_id,
--   c.name as class_name,
--   sc.id as seating_chart_id,
--   sc.layout_name,
--   sa.seat_id,
--   sa.row_index,
--   sa.col_index
-- FROM profiles p
-- LEFT JOIN class_students cs ON cs.student_id = p.id
-- LEFT JOIN classes c ON c.id = COALESCE(cs.class_id, p.class_id)
-- LEFT JOIN seating_charts sc ON sc.class_id = c.id AND sc.is_active = true
-- LEFT JOIN seat_assignments sa ON sa.seating_chart_id = sc.id AND sa.student_id = p.id
-- WHERE p.user_id = 'YOUR_USER_ID_HERE';
