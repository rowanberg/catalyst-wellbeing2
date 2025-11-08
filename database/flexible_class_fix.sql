-- Flexible fix that works with any class table structure
-- This detects your actual tables and uses them

-- Step 1: Find what class-related tables you have
SELECT 
  'Available class tables:' as info,
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name LIKE '%class%' OR table_name LIKE '%student%')
ORDER BY table_name;

-- Step 2: Check seating_charts to find which class the students belong to
SELECT 
  'Class from seating chart:' as info,
  sc.id as chart_id,
  sc.class_id,
  sc.layout_name,
  COUNT(sa.id) as students_assigned
FROM seating_charts sc
JOIN seat_assignments sa ON sa.seating_chart_id = sc.id
WHERE sc.is_active = true
GROUP BY sc.id, sc.class_id, sc.layout_name;

-- Step 3: Get the class details (adapt based on your class table columns)
-- This tries to get class info regardless of column names
SELECT 
  'Class details:' as info,
  c.*
FROM classes c
WHERE c.id IN (
  SELECT DISTINCT class_id 
  FROM seating_charts 
  WHERE is_active = true
);

-- Step 4: Show students who need class_id updated
SELECT 
  'Students needing update:' as info,
  p.id,
  p.first_name,
  p.last_name,
  p.class_id as current_class_id,
  sc.class_id as needed_class_id,
  sa.seat_id
FROM profiles p
JOIN seat_assignments sa ON sa.student_id = p.id
JOIN seating_charts sc ON sc.id = sa.seating_chart_id
WHERE p.role = 'student'
  AND (p.class_id IS NULL OR p.class_id != sc.class_id);

-- Step 5: THE FIX - Update using seating chart class_id
-- This is safe and uses the relationship that already exists
UPDATE profiles
SET class_id = subquery.chart_class_id
FROM (
  SELECT DISTINCT
    sa.student_id,
    sc.class_id as chart_class_id
  FROM seat_assignments sa
  JOIN seating_charts sc ON sc.id = sa.seating_chart_id
  WHERE sc.is_active = true
) AS subquery
WHERE profiles.id = subquery.student_id
  AND profiles.role = 'student'
  AND (profiles.class_id IS NULL OR profiles.class_id != subquery.chart_class_id);

-- Step 6: Verify it worked
SELECT 
  '✅ VERIFICATION - All students now linked:' as result,
  p.id,
  p.first_name,
  p.last_name,
  p.class_id,
  sa.seat_id,
  sa.row_index,
  sa.col_index
FROM profiles p
JOIN seat_assignments sa ON sa.student_id = p.id
JOIN seating_charts sc ON sc.id = sa.seating_chart_id
WHERE p.role = 'student'
ORDER BY sa.seat_id;
