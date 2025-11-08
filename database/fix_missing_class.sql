-- Fix missing class issue
-- Either create the missing class or link to an existing one

-- Option 1: Check what classes actually exist
SELECT 
  'Existing classes:' as info,
  id,
  class_name,
  grade_level,
  section,
  is_active
FROM classes;

-- Option 2: Check what class_id the seating chart thinks it belongs to
SELECT 
  'Seating chart class reference:' as info,
  sc.id as chart_id,
  sc.class_id,
  sc.layout_name,
  c.id as class_exists
FROM seating_charts sc
LEFT JOIN classes c ON c.id = sc.class_id
WHERE sc.is_active = true;

-- Option 3A: CREATE the missing class (if it doesn't exist)
-- Uncomment and run this if you want to create a new class
/*
INSERT INTO classes (id, class_name, grade_level, section, school_id, is_active)
VALUES (
  '1aed301a-7e74-4c8c-a142-0d094bbf9712',
  'Class 10A',
  10,
  'A',
  (SELECT id FROM schools LIMIT 1),
  true
)
ON CONFLICT (id) DO NOTHING;
*/

-- Option 3B: UPDATE student_class_assignments to use an existing class
-- Run this if you want to link students to an existing class instead
/*
-- First, get an existing class ID
SELECT id, class_name FROM classes LIMIT 1;

-- Then update student_class_assignments
UPDATE student_class_assignments
SET class_id = 'your-existing-class-id-here'
WHERE class_id = '1aed301a-7e74-4c8c-a142-0d094bbf9712';

-- And update seating_charts
UPDATE seating_charts
SET class_id = 'your-existing-class-id-here'
WHERE class_id = '1aed301a-7e74-4c8c-a142-0d094bbf9712';
*/

-- Verification: Check if everything is linked correctly now
SELECT 
  'Final check - all connected:' as result,
  p.first_name,
  p.last_name,
  sca.class_id,
  c.class_name,
  c.grade_level,
  c.section,
  sa.seat_id
FROM profiles p
JOIN student_class_assignments sca ON sca.student_id = p.user_id
JOIN classes c ON c.id = sca.class_id
LEFT JOIN seat_assignments sa ON sa.student_id = p.id
WHERE p.role = 'student'
ORDER BY sa.seat_id;
