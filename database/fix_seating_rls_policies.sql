-- ============================================
-- Fix RLS Policies for Seating Charts
-- ============================================
-- The issue: teacher_id stores profile.id, but auth.uid() returns the auth user ID
-- Solution: Join to profiles table to check user_id = auth.uid()

-- Drop existing policies
DROP POLICY IF EXISTS seating_charts_teacher_policy ON seating_charts;
DROP POLICY IF EXISTS seat_assignments_teacher_policy ON seat_assignments;
DROP POLICY IF EXISTS seating_history_teacher_policy ON seating_chart_history;
DROP POLICY IF EXISTS seating_preferences_teacher_policy ON seating_preferences;
DROP POLICY IF EXISTS seating_analytics_teacher_policy ON seating_analytics;

-- Recreate policy for seating_charts
-- Allow teachers to manage seating charts where teacher_id = their profile.id
CREATE POLICY seating_charts_teacher_policy ON seating_charts
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = seating_charts.teacher_id
            AND p.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = seating_charts.teacher_id
            AND p.user_id = auth.uid()
        )
    );

-- Recreate policy for seat_assignments
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

-- Recreate policy for seating_chart_history
-- Allow SELECT and INSERT (INSERT needed for triggers)
CREATE POLICY seating_history_teacher_policy ON seating_chart_history
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = seating_chart_history.teacher_id
            AND p.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = seating_chart_history.teacher_id
            AND p.user_id = auth.uid()
        )
    );

-- Recreate policy for seating_preferences
CREATE POLICY seating_preferences_teacher_policy ON seating_preferences
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = seating_preferences.teacher_id
            AND p.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = seating_preferences.teacher_id
            AND p.user_id = auth.uid()
        )
    );

-- Recreate policy for seating_analytics
CREATE POLICY seating_analytics_teacher_policy ON seating_analytics
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM seating_charts sc
            JOIN profiles p ON p.id = sc.teacher_id
            WHERE sc.id = seating_analytics.seating_chart_id
            AND p.user_id = auth.uid()
        )
    );

-- Verify policies are active
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename IN ('seating_charts', 'seat_assignments')
ORDER BY tablename, policyname;
