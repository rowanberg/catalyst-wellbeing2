-- Populate student_class_assignments table based on seating assignments
-- This links students to their classes using the correct table structure

-- Step 1: Check current state
SELECT 
  '=== Current student_class_assignments ===' as info,
  COUNT(*) as total_records,
  COUNT(DISTINCT student_id) as unique_students,
  COUNT(DISTINCT class_id) as unique_classes
FROM student_class_assignments;

-- Step 2: Show students with seats but NO class assignment record
SELECT 
  '=== Students needing class assignment ===' as info,
  p.user_id,
  p.first_name,
  p.last_name,
  sa.seat_id,
  sc.class_id as needed_class_id,
  sc.layout_name
FROM profiles p
JOIN seat_assignments sa ON sa.student_id = p.id
JOIN seating_charts sc ON sc.id = sa.seating_chart_id
LEFT JOIN student_class_assignments sca ON sca.student_id = p.user_id AND sca.class_id = sc.class_id
WHERE p.role = 'student'
  AND sca.id IS NULL;

-- Step 3: Get school_id (needed for the insert)
SELECT 
  '=== School ID ===' as info,
  id as school_id,
  name as school_name
FROM schools
LIMIT 1;

-- Step 4: THE FIX - Insert student class assignments
-- This uses the seating chart to determine which class students belong to
INSERT INTO student_class_assignments (
  student_id,
  class_id,
  school_id,
  is_active,
  is_primary
)
SELECT DISTINCT
  p.user_id as student_id,  -- Uses auth.users.id (not profile.id)
  sc.class_id,
  (SELECT id FROM schools LIMIT 1) as school_id,  -- Get the school_id
  true as is_active,
  true as is_primary  -- Assuming primary class
FROM profiles p
JOIN seat_assignments sa ON sa.student_id = p.id
JOIN seating_charts sc ON sc.id = sa.seating_chart_id
WHERE p.role = 'student'
  AND sc.is_active = true
  AND NOT EXISTS (
    -- Don't create duplicates
    SELECT 1 FROM student_class_assignments sca
    WHERE sca.student_id = p.user_id 
      AND sca.class_id = sc.class_id
  );

-- Step 5: Verify the fix
SELECT 
  '✅ VERIFICATION - All students now in student_class_assignments:' as result,
  p.user_id,
  p.first_name,
  p.last_name,
  sca.class_id,
  sca.is_active,
  sca.is_primary,
  sa.seat_id
FROM student_class_assignments sca
JOIN profiles p ON p.user_id = sca.student_id
JOIN seat_assignments sa ON sa.student_id = p.id
WHERE sca.is_active = true
ORDER BY sa.seat_id;

-- Step 6: Check specific student (Lirish Raghav)
SELECT 
  'Lirish Raghav check:' as info,
  p.user_id,
  p.first_name,
  p.last_name,
  sca.class_id,
  sca.is_active,
  sa.seat_id
FROM profiles p
LEFT JOIN student_class_assignments sca ON sca.student_id = p.user_id
LEFT JOIN seat_assignments sa ON sa.student_id = p.id
WHERE p.id = '44149730-f7f4-499d-b924-19c5a1ad91f2';
