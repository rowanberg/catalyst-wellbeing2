-- Fix parent attendance SELECT policy to use user_ids correctly
-- Issue: parent_child_relationships stores user_ids, not profile ids

-- Drop the incorrect policy
DROP POLICY IF EXISTS "parents_select_attendance" ON attendance;

-- Create corrected policy using user_ids
CREATE POLICY "parents_select_attendance" ON attendance
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM parent_child_relationships pcr
            JOIN profiles student_profile ON student_profile.id = attendance.student_id
            WHERE pcr.parent_id = auth.uid()  -- parent user_id
            AND pcr.child_id = student_profile.user_id  -- student user_id
        )
    );

-- Verify the policy
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'attendance' AND policyname = 'parents_select_attendance';

-- Test the policy works by checking if parent can see their child's attendance
SET ROLE authenticated;
SET request.jwt.claim.sub = '59617679-eccb-47d3-8543-70a19848e0a5'; -- parent user_id

SELECT COUNT(*) as attendance_records
FROM attendance
WHERE student_id = '36d15ff5-52a8-4b94-91ee-c81c0e4f4387';

RESET ROLE;
