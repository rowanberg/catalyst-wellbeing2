-- Check the current state of seating data

-- 1. All seating charts for this class
SELECT 
  '=== All Seating Charts ===' as info,
  id,
  layout_name,
  is_active,
  created_at
FROM seating_charts
WHERE class_id = '1aed301a-7e74-4c8c-a142-0d094bbf9712'
ORDER BY created_at DESC;

-- 2. Seat assignments for Lirish (student we're testing)
SELECT 
  '=== Lirish Seat Assignments ===' as info,
  sa.id,
  sa.seating_chart_id,
  sa.student_id,
  sa.seat_id,
  sc.is_active as chart_is_active,
  sc.layout_name
FROM seat_assignments sa
JOIN seating_charts sc ON sc.id = sa.seating_chart_id
WHERE sa.student_id = '44149730-f7f4-499d-b924-19c5a1ad91f2';

-- 3. All assignments for active charts
SELECT 
  '=== All Assignments (Active Charts Only) ===' as info,
  sa.student_id,
  sa.seat_id,
  sc.id as chart_id,
  sc.is_active,
  sc.layout_name
FROM seat_assignments sa
JOIN seating_charts sc ON sc.id = sa.seating_chart_id
WHERE sc.class_id = '1aed301a-7e74-4c8c-a142-0d094bbf9712'
  AND sc.is_active = true
ORDER BY sa.seat_id;
