-- Check ALL seat assignments for Lirish across all charts

SELECT 
  'All seat assignments for Lirish:' as info,
  sa.id,
  sa.seating_chart_id,
  sa.student_id,
  sa.seat_id,
  sc.is_active as chart_is_active,
  sc.layout_name,
  sa.created_at
FROM seat_assignments sa
LEFT JOIN seating_charts sc ON sc.id = sa.seating_chart_id
WHERE sa.student_id = '44149730-f7f4-499d-b924-19c5a1ad91f2'
ORDER BY sa.created_at DESC;

-- Count assignments per chart
SELECT 
  'Assignments per chart:' as info,
  sc.id as chart_id,
  sc.layout_name,
  sc.is_active,
  COUNT(sa.id) as assignment_count
FROM seating_charts sc
LEFT JOIN seat_assignments sa ON sa.seating_chart_id = sc.id
WHERE sc.class_id = '1aed301a-7e74-4c8c-a142-0d094bbf9712'
GROUP BY sc.id, sc.layout_name, sc.is_active
ORDER BY sc.created_at DESC;
