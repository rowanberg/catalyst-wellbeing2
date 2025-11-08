-- Check all seating charts and assignments for your class
-- Replace this with your actual class_id
SET LOCAL search_path TO public;

-- 1. Check all seating charts for your class
SELECT 
    sc.id as chart_id,
    sc.layout_name,
    sc.is_active,
    sc.created_at,
    sc.updated_at,
    (SELECT COUNT(*) FROM seat_assignments sa WHERE sa.seating_chart_id = sc.id) as assignment_count
FROM seating_charts sc
WHERE sc.class_id = '1aed301a-7e74-4c8c-a142-0d094bbf9712'
ORDER BY sc.created_at DESC;

-- 2. Check ALL seat assignments across all charts
SELECT 
    sa.id,
    sa.seating_chart_id,
    sa.student_id,
    sa.seat_id,
    sa.row_index,
    sa.col_index,
    sa.assignment_method,
    sa.assigned_at,
    sc.layout_name,
    sc.is_active
FROM seat_assignments sa
JOIN seating_charts sc ON sc.id = sa.seating_chart_id
WHERE sc.class_id = '1aed301a-7e74-4c8c-a142-0d094bbf9712'
ORDER BY sa.assigned_at DESC;

-- 3. Count total assignments
SELECT 
    sc.id as chart_id,
    sc.is_active,
    COUNT(sa.id) as total_assignments
FROM seating_charts sc
LEFT JOIN seat_assignments sa ON sa.seating_chart_id = sc.id
WHERE sc.class_id = '1aed301a-7e74-4c8c-a142-0d094bbf9712'
GROUP BY sc.id, sc.is_active
ORDER BY sc.created_at DESC;
