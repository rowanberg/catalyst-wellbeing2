-- SUPER SIMPLE FIX - Just get everything from seat_assignments directly
-- No complex joins needed!

-- This shows EXACTLY what the student should see
SELECT 
  '✅ Complete seating info for student:' as info,
  p.user_id,
  p.first_name,
  p.last_name,
  sa.seat_id,
  sa.row_index,
  sa.col_index,
  sc.class_id,
  sc.layout_name,
  sc.rows,
  sc.cols,
  sc.seat_pattern,
  c.class_name,
  c.grade_level,
  c.section
FROM seat_assignments sa
JOIN profiles p ON p.id = sa.student_id
JOIN seating_charts sc ON sc.id = sa.seating_chart_id
JOIN classes c ON c.id = sc.class_id
WHERE p.user_id = '40d72008-4367-4d93-bce6-7e2d73354ce6'  -- The logged-in student's user_id
  AND sc.is_active = true;

-- That's it! This single query has EVERYTHING needed for the seating viewer.
