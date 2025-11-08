-- Fix the active seating chart conflict
-- Only ONE seating chart can be active per class

-- Step 1: Find which seating charts exist for this class
SELECT 
  '=== All seating charts for class 1aed301a ===' as info,
  id,
  layout_name,
  is_active,
  total_seats,
  created_at,
  CASE 
    WHEN id = 'c9a2197f-0a84-431f-a3ab-62dec98d721a' THEN '← Students assigned to THIS one'
    ELSE ''
  END as note
FROM seating_charts
WHERE class_id = '1aed301a-7e74-4c8c-a142-0d094bbf9712'
ORDER BY created_at DESC;

-- Step 2: Count how many students are assigned to each chart
SELECT 
  '=== Student assignments per chart ===' as info,
  sc.id as chart_id,
  sc.layout_name,
  sc.is_active,
  COUNT(sa.id) as students_assigned
FROM seating_charts sc
LEFT JOIN seat_assignments sa ON sa.seating_chart_id = sc.id
WHERE sc.class_id = '1aed301a-7e74-4c8c-a142-0d094bbf9712'
GROUP BY sc.id, sc.layout_name, sc.is_active
ORDER BY students_assigned DESC;

-- Step 3: THE FIX - Deactivate all others, activate the one with students
BEGIN;

-- Deactivate ALL seating charts for this class
UPDATE seating_charts
SET is_active = false
WHERE class_id = '1aed301a-7e74-4c8c-a142-0d094bbf9712';

-- Activate ONLY the one that has student assignments
UPDATE seating_charts
SET is_active = true
WHERE id = 'c9a2197f-0a84-431f-a3ab-62dec98d721a';

COMMIT;

-- Step 4: Verify the fix
SELECT 
  '✅ FIXED - Active seating chart:' as result,
  id,
  layout_name,
  is_active,
  (SELECT COUNT(*) FROM seat_assignments WHERE seating_chart_id = id) as students_assigned
FROM seating_charts
WHERE class_id = '1aed301a-7e74-4c8c-a142-0d094bbf9712'
ORDER BY is_active DESC;
