-- Check the exact layout pattern structure

SELECT 
  'Current layout pattern:' as info,
  id,
  layout_name,
  layout_template_id,
  rows,
  cols,
  total_seats,
  jsonb_array_length(seat_pattern) as pattern_array_length,
  seat_pattern
FROM seating_charts
WHERE id = '08ca43be-421b-44e5-b9c8-16762f92b051';

-- Check what the template looks like
SELECT 'Template should have:' as note,
       'rows * cols elements' as expected_format,
       'Each element is either "seat" or "empty"' as element_types;
