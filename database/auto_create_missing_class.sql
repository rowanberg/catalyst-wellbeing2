-- Automatically create the missing class that seating_charts references

-- Step 1: Create the missing class (using correct schema)
INSERT INTO classes (
  id,
  class_name,
  grade_level,
  section,
  school_id,
  is_active,
  created_at,
  updated_at
)
SELECT 
  '1aed301a-7e74-4c8c-a142-0d094bbf9712',
  'Class 10A',
  10,
  'A',
  (SELECT id FROM schools LIMIT 1),
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM classes 
  WHERE id = '1aed301a-7e74-4c8c-a142-0d094bbf9712'
);

-- Step 2: Verify it was created
SELECT 
  '✅ Class created:' as result,
  id,
  class_name,
  grade_level,
  section,
  is_active
FROM classes
WHERE id = '1aed301a-7e74-4c8c-a142-0d094bbf9712';

-- Step 3: Verify full connection chain
SELECT 
  '✅ Complete verification:' as check,
  p.first_name,
  p.last_name,
  c.class_name,
  c.grade_level,
  c.section,
  sa.seat_id,
  sca.is_active as has_class_assignment
FROM profiles p
JOIN student_class_assignments sca ON sca.student_id = p.user_id
JOIN classes c ON c.id = sca.class_id
LEFT JOIN seat_assignments sa ON sa.student_id = p.id
WHERE p.role = 'student'
  AND c.id = '1aed301a-7e74-4c8c-a142-0d094bbf9712'
ORDER BY sa.seat_id;
