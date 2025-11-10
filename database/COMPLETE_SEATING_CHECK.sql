-- Complete seating arrangement check

-- 1. Active seating chart details
SELECT 
  '=== Active Seating Chart ===' as section,
  id,
  layout_name,
  layout_template_id,
  rows,
  cols,
  total_seats,
  is_active,
  jsonb_array_length(seat_pattern) as pattern_length,
  seat_pattern
FROM seating_charts
WHERE id = '08ca43be-421b-44e5-b9c8-16762f92b051';

-- 2. All seat assignments on this chart
SELECT 
  '=== Seat Assignments ===' as section,
  seat_id,
  row_index,
  col_index,
  student_id,
  p.first_name || ' ' || p.last_name as student_name
FROM seat_assignments sa
JOIN profiles p ON p.id = sa.student_id
WHERE seating_chart_id = '08ca43be-421b-44e5-b9c8-16762f92b051'
ORDER BY row_index, col_index;

-- 3. Expected vs Actual
SELECT 
  '=== Summary ===' as section,
  (SELECT rows FROM seating_charts WHERE id = '08ca43be-421b-44e5-b9c8-16762f92b051') as rows,
  (SELECT cols FROM seating_charts WHERE id = '08ca43be-421b-44e5-b9c8-16762f92b051') as cols,
  (SELECT total_seats FROM seating_charts WHERE id = '08ca43be-421b-44e5-b9c8-16762f92b051') as total_seats,
  (SELECT COUNT(*) FROM seat_assignments WHERE seating_chart_id = '08ca43be-421b-44e5-b9c8-16762f92b051') as assigned_students;
