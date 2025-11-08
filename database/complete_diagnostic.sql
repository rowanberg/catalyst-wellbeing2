-- Complete diagnostic - run this and share ALL results

-- Part 1: Classes table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'classes'
ORDER BY ordinal_position;

-- Part 2: Sample class (to see actual column names and data)
SELECT * FROM classes LIMIT 1;

-- Part 3: Students with class_id
SELECT id, first_name, last_name, class_id, user_id
FROM profiles
WHERE role = 'student'
LIMIT 5;

-- Part 4: Active seating charts
SELECT id, class_id, layout_name, is_active, rows, cols
FROM seating_charts
WHERE is_active = true;

-- Part 5: Seat assignments with student names
SELECT 
  sa.seat_id,
  sa.row_index,
  sa.col_index,
  sa.student_id,
  p.first_name,
  p.last_name
FROM seat_assignments sa
LEFT JOIN profiles p ON p.id = sa.student_id
LIMIT 10;
