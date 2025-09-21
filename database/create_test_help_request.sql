-- Create test help request to verify the system works
-- Run this in Supabase SQL Editor after setting up the tables

-- Update existing profile to be a student, or skip if already exists
UPDATE profiles 
SET 
    role = 'student',
    school_code = 'TEST001',
    grade_level = '5th Grade',
    class_name = 'Class A'
WHERE user_id IN (
    SELECT id FROM auth.users LIMIT 1
)
AND role != 'admin';

-- Create a test help request from the student we just created
INSERT INTO help_requests (student_id, school_id, school_code, message, urgency, status)
SELECT 
    p.user_id,
    schools.id,
    schools.school_code,
    'This is a test help request to verify the admin messaging system is working correctly.',
    'medium',
    'pending'
FROM schools, profiles p
WHERE schools.school_code = 'TEST001'
AND p.role = 'student' 
AND p.school_code = 'TEST001'
AND NOT EXISTS (
    SELECT 1 FROM help_requests hr
    WHERE hr.student_id = p.user_id
)
LIMIT 1;

-- Verify the data was created
SELECT 
    hr.id,
    hr.message,
    hr.urgency,
    hr.status,
    hr.created_at,
    p.first_name,
    p.last_name,
    p.school_code,
    s.name as school_name
FROM help_requests hr
JOIN profiles p ON hr.student_id = p.user_id
JOIN schools s ON hr.school_id = s.id
WHERE p.school_code = 'TEST001';
