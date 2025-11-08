-- Check the seat_pattern format in the database

SELECT 
  'Seating chart seat_pattern:' as info,
  id,
  layout_name,
  is_active,
  rows,
  cols,
  pg_typeof(seat_pattern) as pattern_type,
  seat_pattern
FROM seating_charts
WHERE id = 'c9a2197f-0a84-431f-a3ab-62dec98d721a';
