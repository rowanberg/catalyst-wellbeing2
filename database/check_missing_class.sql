-- Check why class 1aed301a-7e74-4c8c-a142-0d094bbf9712 doesn't exist

-- Step 1: Check if this class_id exists in classes table
SELECT 
  'Does class exist in classes table?' as check,
  COUNT(*) as exists_count
FROM classes
WHERE id = '1aed301a-7e74-4c8c-a142-0d094bbf9712';

-- Step 2: See what's actually in the classes table
SELECT 
  'All classes in database:' as info,
  id,
  class_name,
  grade_level,
  section,
  is_active
FROM classes
LIMIT 10;

-- Step 3: Check seating_charts to see what class_id it references
SELECT 
  'Seating chart class_id:' as info,
  id as chart_id,
  class_id,
  layout_name,
  is_active
FROM seating_charts
WHERE is_active = true;

-- Step 4: Check student_class_assignments
SELECT 
  'Student class assignments:' as info,
  id,
  student_id,
  class_id,
  is_active
FROM student_class_assignments
LIMIT 10;

-- Step 5: Find the mismatch - class_id in assignments but not in classes
SELECT 
  'PROBLEM - Class IDs that dont exist:' as issue,
  DISTINCT sca.class_id as missing_class_id,
  COUNT(sca.id) as affected_assignments
FROM student_class_assignments sca
LEFT JOIN classes c ON c.id = sca.class_id
WHERE c.id IS NULL
GROUP BY sca.class_id;
