-- Debug Student Class Assignments
-- Run this to see what's in the student_class_assignments table

-- 1. Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'student_class_assignments'
ORDER BY ordinal_position;

-- 2. Check all student assignments for your school
SELECT 
  sca.*,
  p.first_name,
  p.last_name,
  c.class_name,
  gl.grade_level
FROM student_class_assignments sca
LEFT JOIN profiles p ON p.user_id = sca.student_id
LEFT JOIN classes c ON c.id = sca.class_id
LEFT JOIN grade_levels gl ON gl.id = c.grade_level_id
WHERE sca.school_id = 'f2baa26b-ad79-4576-bead-e57dc942e4f8'
ORDER BY sca.assigned_at DESC;

-- 3. Check if there are any assignments without is_active flag
SELECT 
  sca.*,
  p.first_name,
  p.last_name
FROM student_class_assignments sca
LEFT JOIN profiles p ON p.user_id = sca.student_id
WHERE sca.school_id = 'f2baa26b-ad79-4576-bead-e57dc942e4f8'
  AND (sca.is_active IS NULL OR sca.is_active = false);

-- 4. Count students by class
SELECT 
  c.class_name,
  c.id as class_id,
  gl.grade_level,
  COUNT(sca.student_id) as total_students,
  COUNT(CASE WHEN sca.is_active = true THEN 1 END) as active_students
FROM classes c
LEFT JOIN student_class_assignments sca ON sca.class_id = c.id
LEFT JOIN grade_levels gl ON gl.id = c.grade_level_id
WHERE c.school_id = 'f2baa26b-ad79-4576-bead-e57dc942e4f8'
GROUP BY c.id, c.class_name, gl.grade_level
ORDER BY gl.grade_level, c.class_name;

-- 5. Check specific class that's not showing students
SELECT 
  sca.*,
  p.first_name,
  p.last_name,
  p.role
FROM student_class_assignments sca
LEFT JOIN profiles p ON p.user_id = sca.student_id
WHERE sca.class_id = '1aed301a-7e74-4c8c-a142-0d094bbf9712';
