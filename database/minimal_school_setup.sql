-- Minimal SQL to add school_id support to help_requests table
-- Run this if you're getting syntax errors with the full schema

-- Add school_id column if it doesn't exist
ALTER TABLE help_requests 
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_help_requests_school_id ON help_requests(school_id);

-- Update existing help requests to populate school_id
UPDATE help_requests 
SET school_id = (
    SELECT p.school_id 
    FROM profiles p 
    WHERE p.user_id = help_requests.student_id
)
WHERE school_id IS NULL;

-- Update RLS policies for school-based filtering
DROP POLICY IF EXISTS "Teachers and admins can view help requests" ON help_requests;
CREATE POLICY "Teachers and admins can view help requests" ON help_requests FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = auth.uid() 
        AND p.role IN ('teacher', 'admin')
        AND p.school_id = help_requests.school_id
    )
);

DROP POLICY IF EXISTS "Admins can update help requests from their school" ON help_requests;
CREATE POLICY "Admins can update help requests from their school" ON help_requests FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = auth.uid() 
        AND p.role = 'admin'
        AND p.school_id = help_requests.school_id
    )
);

DROP POLICY IF EXISTS "Students can insert own help requests" ON help_requests;
CREATE POLICY "Students can insert own help requests" ON help_requests FOR INSERT WITH CHECK (
    auth.uid() = student_id 
    AND EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = auth.uid()
        AND p.role = 'student'
        AND p.school_id = help_requests.school_id
    )
);
