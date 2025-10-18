-- Fix attendance RLS policies to allow teacher inserts
-- The issue: FOR ALL USING clause doesn't allow inserts properly
-- Solution: Separate policies for SELECT, INSERT, UPDATE, DELETE

-- Drop existing policies
DROP POLICY IF EXISTS "Teachers can manage attendance for their school" ON attendance;
DROP POLICY IF EXISTS "attendance_policy" ON attendance;
DROP POLICY IF EXISTS "Parents can view their children's attendance" ON attendance;
DROP POLICY IF EXISTS "parent_view_child_attendance" ON attendance;

-- 1. SELECT Policy: Teachers can view attendance in their school
CREATE POLICY "teachers_select_attendance" ON attendance
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role IN ('teacher', 'admin', 'principal')
            AND profiles.school_id = attendance.school_id
        )
    );

-- 2. INSERT Policy: Teachers can insert attendance for their school
CREATE POLICY "teachers_insert_attendance" ON attendance
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role IN ('teacher', 'admin', 'principal')
            AND profiles.school_id = attendance.school_id
        )
    );

-- 3. UPDATE Policy: Teachers can update attendance in their school
CREATE POLICY "teachers_update_attendance" ON attendance
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role IN ('teacher', 'admin', 'principal')
            AND profiles.school_id = attendance.school_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role IN ('teacher', 'admin', 'principal')
            AND profiles.school_id = attendance.school_id
        )
    );

-- 4. DELETE Policy: Teachers can delete attendance in their school
CREATE POLICY "teachers_delete_attendance" ON attendance
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role IN ('teacher', 'admin', 'principal')
            AND profiles.school_id = attendance.school_id
        )
    );

-- 5. Parent SELECT Policy: Parents can view their children's attendance
CREATE POLICY "parents_select_attendance" ON attendance
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM parent_child_relationships pcr
            JOIN profiles p ON p.user_id = auth.uid()
            WHERE pcr.parent_id = p.id
            AND pcr.child_id = attendance.student_id
        )
    );

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'attendance'
ORDER BY policyname;
