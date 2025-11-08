-- SIMPLE FIX - Find and fix the mismatch between student assignments and actual classes

-- Step 1: Show the problem - what class_id is in student_class_assignments?
SELECT 
  '❌ PROBLEM - Wrong class_id in assignments:' as issue,
  sca.class_id as wrong_class_id,
  COUNT(*) as affected_students
FROM student_class_assignments sca
LEFT JOIN classes c ON c.id = sca.class_id
WHERE c.id IS NULL
GROUP BY sca.class_id;

-- Step 2: Show what classes actually exist
SELECT 
  '✅ ACTUAL CLASSES that exist:' as info,
  id as correct_class_id,
  class_name,
  grade_level,
  section
FROM classes
WHERE is_active = true;

-- Step 3: Show students with seats and which class they should belong to
SELECT 
  '🔧 Students need to be in THIS class:' as fix_needed,
  sc.class_id as correct_class_id,
  c.class_name,
  COUNT(DISTINCT sa.student_id) as students_with_seats
FROM seating_charts sc
JOIN seat_assignments sa ON sa.seating_chart_id = sc.id
LEFT JOIN classes c ON c.id = sc.class_id
WHERE sc.is_active = true
GROUP BY sc.class_id, c.class_name;

-- Step 4: THE FIX - Update student_class_assignments to use the correct class_id from seating
UPDATE student_class_assignments sca
SET class_id = subquery.correct_class_id
FROM (
  SELECT DISTINCT
    p.user_id as student_user_id,
    sc.class_id as correct_class_id
  FROM seat_assignments sa
  JOIN seating_charts sc ON sc.id = sa.seating_chart_id
  JOIN profiles p ON p.id = sa.student_id
  WHERE sc.is_active = true
) AS subquery
WHERE sca.student_id = subquery.student_user_id;

-- Step 5: Verify it's fixed
SELECT 
  '✅ FIXED - Students now linked to correct class:' as result,
  p.first_name,
  p.last_name,
  c.class_name,
  c.grade_level,
  sa.seat_id
FROM student_class_assignments sca
JOIN profiles p ON p.user_id = sca.student_id
JOIN classes c ON c.id = sca.class_id
JOIN seat_assignments sa ON sa.student_id = p.id
WHERE p.role = 'student'
ORDER BY sa.seat_id;
