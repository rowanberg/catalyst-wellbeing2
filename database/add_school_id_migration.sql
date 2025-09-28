-- Migration to add school_id column to help_requests table
-- This ensures help requests are directly linked to schools for better filtering

-- Add school_id column if it doesn't exist
ALTER TABLE help_requests 
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

-- Create index for faster school-based filtering
CREATE INDEX IF NOT EXISTS idx_help_requests_school_id ON help_requests(school_id);

-- Update existing help requests to populate school_id based on student's school
UPDATE help_requests 
SET school_id = (
    SELECT p.school_id 
    FROM profiles p 
    WHERE p.user_id = help_requests.student_id
)
WHERE school_id IS NULL;

-- Make school_id NOT NULL after populating existing records
ALTER TABLE help_requests 
ALTER COLUMN school_id SET NOT NULL;

-- Update RLS policies to use school_id for filtering
DROP POLICY IF EXISTS "Teachers and admins can view help requests" ON help_requests;
CREATE POLICY "Teachers and admins can view help requests" ON help_requests FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = auth.uid() 
        AND p.role IN ('teacher', 'admin')
        AND p.school_id = help_requests.school_id
    )
);

-- Update admin update policy to use school_id
DROP POLICY IF EXISTS "Admins can update help requests from their school" ON help_requests;
CREATE POLICY "Admins can update help requests from their school" ON help_requests FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = auth.uid() 
        AND p.role = 'admin'
        AND p.school_id = help_requests.school_id
    )
);

-- Update student insert policy to ensure they can only create requests for their school
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
