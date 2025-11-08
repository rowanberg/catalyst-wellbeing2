-- Check if students have class_id values in profiles table
-- Since class_students table doesn't exist, we'll use profiles.class_id

-- 1. Check students with class_id populated
SELECT 
  '=== STUDENTS WITH CLASS_ID ===' as info,
  p.id,
  p.user_id,
  p.first_name,
  p.last_name,
  p.class_id,
  c.name as class_name,
  c.grade_level
FROM profiles p
LEFT JOIN classes c ON c.id = p.class_id
WHERE p.role = 'student'
ORDER BY p.last_name, p.first_name
LIMIT 20;

-- 2. Count students with vs without class_id
SELECT 
  '=== STUDENT CLASS STATUS ===' as info,
  COUNT(*) FILTER (WHERE class_id IS NOT NULL) as with_class,
  COUNT(*) FILTER (WHERE class_id IS NULL) as without_class,
  COUNT(*) as total_students
FROM profiles
WHERE role = 'student';

-- 3. List all available classes
SELECT 
  '=== AVAILABLE CLASSES ===' as info,
  id,
  name,
  grade_level,
  section
FROM classes
ORDER BY grade_level, section, name;

-- 4. Students without class_id (need assignment)
SELECT 
  '=== STUDENTS NEEDING CLASS ASSIGNMENT ===' as info,
  id,
  user_id,
  first_name,
  last_name,
  email
FROM profiles
WHERE role = 'student' 
  AND class_id IS NULL
LIMIT 10;
