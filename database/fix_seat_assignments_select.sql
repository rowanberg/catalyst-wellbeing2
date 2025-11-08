-- Quick Fix: Update seat_assignments RLS policy to allow SELECT
-- The issue is likely that the policy blocks SELECT operations

-- Drop existing policy
DROP POLICY IF EXISTS seat_assignments_teacher_policy ON seat_assignments;

-- Recreate with proper SELECT support
CREATE POLICY seat_assignments_teacher_policy ON seat_assignments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM seating_charts sc
            JOIN profiles p ON p.id = sc.teacher_id
            WHERE sc.id = seat_assignments.seating_chart_id
            AND p.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM seating_charts sc
            JOIN profiles p ON p.id = sc.teacher_id
            WHERE sc.id = seat_assignments.seating_chart_id
            AND p.user_id = auth.uid()
        )
    );

-- Verify the policy
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'seat_assignments';

-- Test if you can now select assignments
SELECT COUNT(*) as assignment_count
FROM seat_assignments
WHERE seating_chart_id = 'c9a2197f-0a84-431f-a3ab-62dec98d721a';
