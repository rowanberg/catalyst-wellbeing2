-- Populate class_students table with test data
-- Run this AFTER creating the class_students table

-- OPTION 1: If students have class_id in profiles table
-- This will copy the relationship from profiles to class_students
INSERT INTO class_students (student_id, class_id, is_active)
SELECT 
  p.id as student_id,
  p.class_id,
  true as is_active
FROM profiles p
WHERE p.role = 'student' 
  AND p.class_id IS NOT NULL
  AND NOT EXISTS (
    -- Don't duplicate existing records
    SELECT 1 FROM class_students cs 
    WHERE cs.student_id = p.id AND cs.class_id = p.class_id
  );

-- Check results
SELECT 
  'Students linked to classes:' as message,
  COUNT(*) as total_links,
  COUNT(DISTINCT student_id) as unique_students,
  COUNT(DISTINCT class_id) as unique_classes
FROM class_students;

-- Show the linked students
SELECT 
  p.first_name,
  p.last_name,
  c.name as class_name,
  c.grade_level,
  cs.enrolled_at
FROM class_students cs
JOIN profiles p ON p.id = cs.student_id
JOIN classes c ON c.id = cs.class_id
ORDER BY c.name, p.last_name, p.first_name
LIMIT 20;

-- OPTION 2: Manual insert for specific students (if needed)
-- Uncomment and customize:
/*
INSERT INTO class_students (student_id, class_id)
VALUES 
  -- Replace with actual UUIDs from your database
  ('student-uuid-1', 'class-uuid-1'),
  ('student-uuid-2', 'class-uuid-1'),
  ('student-uuid-3', 'class-uuid-2')
ON CONFLICT (student_id, class_id) DO NOTHING;
*/

-- Show students NOT linked to any class (potential issues)
SELECT 
  'Students without class assignment:' as warning,
  p.id,
  p.first_name,
  p.last_name,
  p.email
FROM profiles p
LEFT JOIN class_students cs ON cs.student_id = p.id
WHERE p.role = 'student' 
  AND cs.id IS NULL
LIMIT 10;
