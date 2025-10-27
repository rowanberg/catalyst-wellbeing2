-- Restore Original Working RLS Policies for School Announcements
-- These were working before - reverting to original schema

-- Drop ALL existing policies (both old and new names)
DROP POLICY IF EXISTS "admins_manage_announcements" ON school_announcements;
DROP POLICY IF EXISTS "students_view_announcements" ON school_announcements;
DROP POLICY IF EXISTS "teachers_view_announcements" ON school_announcements;
DROP POLICY IF EXISTS "parents_view_announcements" ON school_announcements;
DROP POLICY IF EXISTS "Admins can manage school announcements" ON school_announcements;
DROP POLICY IF EXISTS "Students can view active announcements" ON school_announcements;
DROP POLICY IF EXISTS "Teachers can view active announcements" ON school_announcements;
DROP POLICY IF EXISTS "Parents can view active announcements" ON school_announcements;
DROP POLICY IF EXISTS "Users can view announcements for their role" ON school_announcements;
DROP POLICY IF EXISTS "View school announcements" ON school_announcements;

-- Restore original working policies from school_announcements_schema.sql
-- Policy for admins
CREATE POLICY "Admins can manage school announcements" ON school_announcements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin' 
            AND profiles.school_id = school_announcements.school_id
        )
    );

-- Policy for students (ORIGINAL - no role check, just school match)
CREATE POLICY "Students can view active announcements" ON school_announcements
    FOR SELECT USING (
        is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (target_audience IN ('all', 'students'))
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.school_id = school_announcements.school_id
        )
    );

-- Policy for teachers
CREATE POLICY "Teachers can view active announcements" ON school_announcements
    FOR SELECT USING (
        is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (target_audience IN ('all', 'teachers'))
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'teacher'
            AND profiles.school_id = school_announcements.school_id
        )
    );

-- Policy for parents
CREATE POLICY "Parents can view active announcements" ON school_announcements
    FOR SELECT USING (
        is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (target_audience IN ('all', 'parents'))
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'parent'
            AND profiles.school_id = school_announcements.school_id
        )
    );
