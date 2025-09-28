-- Migration script to add encryption support to existing database
-- Run this after the main schema.sql to add encryption fields

-- Add messaging_encryption_key column to schools table if it doesn't exist
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS messaging_encryption_key VARCHAR(64) UNIQUE;

-- Add encryption fields to help_requests table if they don't exist
ALTER TABLE help_requests 
ADD COLUMN IF NOT EXISTS encrypted_message TEXT,
ADD COLUMN IF NOT EXISTS school_encryption_key VARCHAR(64);

-- Update existing schools with encryption keys (you'll need to run this manually for each school)
-- Example:
-- UPDATE schools SET messaging_encryption_key = 'generated_key_here' WHERE id = 'school_id_here';

-- Create index for faster filtering by school encryption key
CREATE INDEX IF NOT EXISTS idx_help_requests_school_encryption_key 
ON help_requests(school_encryption_key);

-- Create index for faster school lookups
CREATE INDEX IF NOT EXISTS idx_schools_messaging_encryption_key 
ON schools(messaging_encryption_key);

-- Update RLS policies to include encryption key filtering
DROP POLICY IF EXISTS "Teachers and admins can view help requests" ON help_requests;
DROP POLICY IF EXISTS "Admins can update help requests from their school" ON help_requests;
DROP POLICY IF EXISTS "School-isolated help requests view" ON help_requests;
DROP POLICY IF EXISTS "School-isolated help requests update" ON help_requests;
DROP POLICY IF EXISTS "Students can create help requests for their school" ON help_requests;

-- New RLS policy: Teachers and admins can only view help requests from their school
CREATE POLICY "School-isolated help requests view" ON help_requests
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN schools s ON p.school_id = s.id
    WHERE p.user_id = auth.uid()
    AND p.role IN ('teacher', 'admin')
    AND s.messaging_encryption_key = help_requests.school_encryption_key
  )
);

-- New RLS policy: Admins can only update help requests from their school
CREATE POLICY "School-isolated help requests update" ON help_requests
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN schools s ON p.school_id = s.id
    WHERE p.user_id = auth.uid()
    AND p.role = 'admin'
    AND s.messaging_encryption_key = help_requests.school_encryption_key
  )
);

-- Students can only insert help requests with their school's encryption key
CREATE POLICY "Students can create help requests for their school" ON help_requests
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN schools s ON p.school_id = s.id
    WHERE p.user_id = auth.uid()
    AND p.role = 'student'
    AND s.messaging_encryption_key = help_requests.school_encryption_key
  )
);

-- Students can view their own help requests (drop existing policy first)
DROP POLICY IF EXISTS "Students can view own help requests" ON help_requests;
CREATE POLICY "Students can view own help requests" ON help_requests
FOR SELECT USING (student_id = auth.uid());
