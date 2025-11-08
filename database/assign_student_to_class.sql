-- Assign students to classes using profiles.class_id
-- Since class_students table doesn't exist, we use profiles.class_id directly

-- STEP 1: View students and classes to get the IDs you need
-- Uncomment and run this first:
/*
SELECT 
  'STUDENTS:' as type,
  id as student_id,
  first_name || ' ' || last_name as student_name,
  email,
  class_id as current_class_id
FROM profiles
WHERE role = 'student'
ORDER BY last_name, first_name;

SELECT 
  'CLASSES:' as type,
  id as class_id,
  name as class_name,
  grade_level,
  section
FROM classes
ORDER BY grade_level, section, name;
*/

-- STEP 2: Assign a specific student to a class
-- Replace the UUIDs with actual values from STEP 1
/*
UPDATE profiles
SET class_id = 'your-class-id-here'
WHERE id = 'your-student-id-here'
  AND role = 'student';

-- Verify the assignment
SELECT 
  'Assignment successful!' as message,
  p.first_name,
  p.last_name,
  c.name as class_name,
  c.grade_level
FROM profiles p
JOIN classes c ON c.id = p.class_id
WHERE p.id = 'your-student-id-here';
*/

-- STEP 3: Bulk assign all students in a grade to a class
-- Useful if you have multiple students without classes
/*
UPDATE profiles
SET class_id = 'your-class-id-here'
WHERE role = 'student'
  AND grade_level = '10'  -- Change to your grade
  AND class_id IS NULL;
*/

-- STEP 4: Verify all assignments
SELECT 
  'Current Student-Class Assignments:' as info,
  p.first_name,
  p.last_name,
  p.grade_level,
  c.name as class_name,
  c.grade_level as class_grade
FROM profiles p
LEFT JOIN classes c ON c.id = p.class_id
WHERE p.role = 'student'
ORDER BY c.name, p.last_name, p.first_name;
