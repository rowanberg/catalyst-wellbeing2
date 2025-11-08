-- Check if the specific seating chart is actually active

-- Check the exact seating chart the API is looking for
SELECT 
  'Seating chart c9a2197f-0a84-431f-a3ab-62dec98d721a status:' as info,
  id,
  class_id,
  layout_name,
  is_active,
  created_at,
  updated_at
FROM seating_charts
WHERE id = 'c9a2197f-0a84-431f-a3ab-62dec98d721a';

-- Check ALL seating charts
SELECT 
  'All seating charts:' as info,
  id,
  class_id,
  layout_name,
  is_active
FROM seating_charts;

-- If is_active is false, fix it:
UPDATE seating_charts
SET is_active = true
WHERE id = 'c9a2197f-0a84-431f-a3ab-62dec98d721a'
  AND is_active = false;

-- Verify the update
SELECT 
  '✅ After fix:' as result,
  id,
  layout_name,
  is_active
FROM seating_charts
WHERE id = 'c9a2197f-0a84-431f-a3ab-62dec98d721a';
