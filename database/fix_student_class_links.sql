-- FIX: Link students to classes based on their seat assignments
-- This updates profiles.class_id for students who have seats but no class_id

-- Step 1: See the problem - students with seats but no class_id
SELECT 
  'Students with seats but NO class_id:' as issue,
  p.id as student_id,
  p.first_name,
  p.last_name,
  p.class_id as current_class_id,
  sa.seat_id,
  sc.class_id as should_be_class_id,
  sc.id as chart_id
FROM profiles p
JOIN seat_assignments sa ON sa.student_id = p.id
JOIN seating_charts sc ON sc.id = sa.seating_chart_id
WHERE p.role = 'student'
  AND p.class_id IS NULL;

-- Step 2: FIX IT - Update profiles.class_id based on their seating chart
UPDATE profiles p
SET class_id = sc.class_id
FROM seat_assignments sa
JOIN seating_charts sc ON sc.id = sa.seating_chart_id
WHERE p.id = sa.student_id
  AND p.role = 'student'
  AND p.class_id IS NULL;

-- Step 3: Verify the fix
SELECT 
  'FIXED - Students now have class_id:' as result,
  p.id as student_id,
  p.first_name,
  p.last_name,
  p.class_id,
  sa.seat_id
FROM profiles p
JOIN seat_assignments sa ON sa.student_id = p.id
WHERE p.role = 'student'
ORDER BY sa.seat_id;

-- Step 4: Check specific student (Lirish Raghav)
SELECT 
  'Lirish Raghav - Should work now:' as check,
  p.id,
  p.first_name,
  p.last_name,
  p.class_id,
  sa.seat_id,
  sc.layout_name
FROM profiles p
LEFT JOIN seat_assignments sa ON sa.student_id = p.id
LEFT JOIN seating_charts sc ON sc.id = sa.seating_chart_id
WHERE p.id = '44149730-f7f4-499d-b924-19c5a1ad91f2';
