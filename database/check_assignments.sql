-- Check if assignments exist in database
SELECT 
    sa.id,
    sa.seating_chart_id,
    sa.student_id,
    sa.seat_id,
    sa.row_index,
    sa.col_index,
    sa.assignment_method,
    sa.assigned_at,
    sc.layout_name
FROM seat_assignments sa
JOIN seating_charts sc ON sc.id = sa.seating_chart_id
WHERE sc.id = 'c9a2197f-0a84-431f-a3ab-62dec98d721a'
ORDER BY sa.row_index, sa.col_index;

-- Check total count
SELECT COUNT(*) as total_assignments
FROM seat_assignments
WHERE seating_chart_id = 'c9a2197f-0a84-431f-a3ab-62dec98d721a';

-- Check the seating chart exists
SELECT 
    id,
    class_id,
    teacher_id,
    layout_template_id,
    layout_name,
    total_seats,
    is_active,
    created_at
FROM seating_charts
WHERE id = 'c9a2197f-0a84-431f-a3ab-62dec98d721a';
