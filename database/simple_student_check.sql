-- Simple diagnostic for student seating issue
-- This avoids assumptions about table column names

-- 1. Check what columns exist in classes table
SELECT 
  '=== CLASSES TABLE COLUMNS ===' as info,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'classes'
ORDER BY ordinal_position;

-- 2. See a sample class record to understand structure
SELECT 
  '=== SAMPLE CLASS RECORDS ===' as info,
  *
FROM classes
LIMIT 3;

-- 3. Check students with their class_id
SELECT 
  '=== STUDENTS WITH CLASS_ID ===' as info,
  p.id,
  p.first_name,
  p.last_name,
  p.class_id,
  p.role
FROM profiles p
WHERE p.role = 'student'
LIMIT 10;

-- 4. Count how many students have class_id
SELECT 
  '=== STUDENT CLASS COUNTS ===' as info,
  COUNT(*) FILTER (WHERE class_id IS NOT NULL) as students_with_class,
  COUNT(*) FILTER (WHERE class_id IS NULL) as students_without_class,
  COUNT(*) as total_students
FROM profiles
WHERE role = 'student';

-- 5. Check if seating_charts table exists
SELECT 
  '=== SEATING CHARTS TABLE ===' as info,
  COUNT(*) as chart_count,
  COUNT(*) FILTER (WHERE is_active = true) as active_charts
FROM seating_charts;

-- 6. Check if seat_assignments table exists
SELECT 
  '=== SEAT ASSIGNMENTS TABLE ===' as info,
  COUNT(*) as assignment_count
FROM seat_assignments;
