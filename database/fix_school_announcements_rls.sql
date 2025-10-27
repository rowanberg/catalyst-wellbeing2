-- Fix School Announcements RLS Policies
-- Drop all existing conflicting policies and create clean ones

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view announcements for their role" ON school_announcements;
DROP POLICY IF EXISTS "Admins can manage school announcements" ON school_announcements;
DROP POLICY IF EXISTS "Students can view active announcements" ON school_announcements;
DROP POLICY IF EXISTS "Teachers can view active announcements" ON school_announcements;
DROP POLICY IF EXISTS "Parents can view active announcements" ON school_announcements;
DROP POLICY IF EXISTS "View school announcements" ON school_announcements;

-- Enable RLS
ALTER TABLE school_announcements ENABLE ROW LEVEL SECURITY;

-- Policy 1: Admins can manage announcements in their school
CREATE POLICY "admins_manage_announcements" ON school_announcements
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin' 
            AND profiles.school_id = school_announcements.school_id
        )
    );

-- Policy 2: Students can view active announcements
CREATE POLICY "students_view_announcements" ON school_announcements
    FOR SELECT 
    USING (
        is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
        AND target_audience IN ('all', 'students')
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.school_id = school_announcements.school_id
            AND profiles.role = 'student'
        )
    );

-- Policy 3: Teachers can view active announcements
CREATE POLICY "teachers_view_announcements" ON school_announcements
    FOR SELECT 
    USING (
        is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
        AND target_audience IN ('all', 'teachers')
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.school_id = school_announcements.school_id
            AND profiles.role = 'teacher'
        )
    );

-- Policy 4: Parents can view active announcements
CREATE POLICY "parents_view_announcements" ON school_announcements
    FOR SELECT 
    USING (
        is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
        AND target_audience IN ('all', 'parents')
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.school_id = school_announcements.school_id
            AND profiles.role = 'parent'
        )
    );

/*
====================================================================================
DIAGNOSTIC QUERIES (Run these separately to verify the fix)
====================================================================================

-- Query 1: Check all announcements in the database
SELECT id, title, school_id, target_audience, is_active, expires_at, created_at
FROM school_announcements 
WHERE is_active = true 
ORDER BY created_at DESC;

-- Query 2: Check what current user can see
SELECT 
    sa.id,
    sa.title,
    sa.school_id,
    sa.target_audience,
    sa.is_active,
    sa.expires_at,
    p.school_id as user_school_id,
    p.role as user_role,
    CASE WHEN sa.school_id = p.school_id THEN '✓ Match' ELSE '✗ Mismatch' END as school_match
FROM school_announcements sa
CROSS JOIN profiles p
WHERE p.user_id = auth.uid()
  AND sa.is_active = true
ORDER BY sa.created_at DESC;

*/
