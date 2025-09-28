-- Quick Student Setup - Creates sample students for testing
-- Run this if no students are showing in the admin progress page

-- First, ensure you have a school and admin profile
-- Check if admin profile exists
SELECT 'Current Admin Profile:' as info, first_name, last_name, role, school_id 
FROM profiles 
WHERE user_id = auth.uid();

-- If no school_id, create a demo school and update admin profile
INSERT INTO schools (id, name, address, phone, email, admin_id, school_code, messaging_encryption_key)
VALUES (
  'demo-school-123'::uuid,
  'Demo Elementary School',
  '123 Education Street',
  '+1-555-0123',
  'admin@demo.edu',
  auth.uid(),
  'DEMO123',
  encode(gen_random_bytes(32), 'hex')
) ON CONFLICT (school_code) DO NOTHING;

-- Update admin profile with school_id if missing
UPDATE profiles 
SET school_id = 'demo-school-123'::uuid,
    role = 'admin'
WHERE user_id = auth.uid();

-- Create sample students
INSERT INTO profiles (
  id, user_id, first_name, last_name, role, school_id, 
  grade_level, xp_points, level_number, streak_days, 
  wellbeing_status, current_mood, gems
) VALUES 
('student-1'::uuid, 'user-1'::uuid, 'Emma', 'Johnson', 'student', 'demo-school-123'::uuid, '5th Grade', 2450, 12, 15, 'thriving', 'happy', 150),
('student-2'::uuid, 'user-2'::uuid, 'Liam', 'Chen', 'student', 'demo-school-123'::uuid, '4th Grade', 1890, 9, 8, 'managing', 'calm', 95),
('student-3'::uuid, 'user-3'::uuid, 'Sophia', 'Rodriguez', 'student', 'demo-school-123'::uuid, '6th Grade', 3120, 15, 22, 'thriving', 'excited', 200),
('student-4'::uuid, 'user-4'::uuid, 'Noah', 'Williams', 'student', 'demo-school-123'::uuid, '3rd Grade', 1245, 6, 5, 'needs_support', 'neutral', 75),
('student-5'::uuid, 'user-5'::uuid, 'Ava', 'Thompson', 'student', 'demo-school-123'::uuid, '5th Grade', 2780, 13, 18, 'managing', 'happy', 180),
('student-6'::uuid, 'user-6'::uuid, 'Ethan', 'Davis', 'student', 'demo-school-123'::uuid, '4th Grade', 1567, 8, 12, 'managing', 'calm', 120)
ON CONFLICT (id) DO NOTHING;

-- Verify students were created
SELECT 'Students Created:' as info, COUNT(*) as count 
FROM profiles 
WHERE role = 'student' AND school_id = 'demo-school-123'::uuid;
