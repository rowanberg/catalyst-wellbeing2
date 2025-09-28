-- Create Admin Profile and School Setup
-- This script creates a test admin profile and school with sample student data

-- First, create a school if it doesn't exist
INSERT INTO schools (id, name, address, phone, email, admin_id, school_code, messaging_encryption_key)
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
  'Demo Elementary School',
  '123 Education Street, Learning City, LC 12345',
  '+1-555-0123',
  'admin@demoschool.edu',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
  'DEMO2024',
  encode(gen_random_bytes(32), 'hex')
) ON CONFLICT (school_code) DO NOTHING;

-- Create an admin user profile (you'll need to replace the user_id with your actual Supabase auth user ID)
-- To get your user ID, go to Supabase Auth > Users and copy your user ID
INSERT INTO profiles (
  id,
  user_id, 
  first_name, 
  last_name, 
  role, 
  school_id,
  xp_points,
  level_number,
  streak_days,
  wellbeing_status,
  gems
) VALUES (
  gen_random_uuid(),
  auth.uid(), -- This will use the currently authenticated user's ID
  'Admin',
  'User',
  'admin',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
  0,
  1,
  0,
  'managing',
  0
) ON CONFLICT (user_id) DO UPDATE SET
  role = 'admin',
  school_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid;

-- Create sample classes
INSERT INTO classes (id, name, grade_level, school_id) VALUES
('c1111111-1111-1111-1111-111111111111'::uuid, 'Class 4A', '4th Grade', 'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid),
('c2222222-2222-2222-2222-222222222222'::uuid, 'Class 5A', '5th Grade', 'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid),
('c3333333-3333-3333-3333-333333333333'::uuid, 'Class 6A', '6th Grade', 'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid)
ON CONFLICT (name, school_id, academic_year) DO NOTHING;

-- Create sample student users and profiles
DO $$
DECLARE
  student_data RECORD;
  student_users UUID[] := ARRAY[
    's1111111-1111-1111-1111-111111111111'::uuid,
    's2222222-2222-2222-2222-222222222222'::uuid,
    's3333333-3333-3333-3333-333333333333'::uuid,
    's4444444-4444-4444-4444-444444444444'::uuid,
    's5555555-5555-5555-5555-555555555555'::uuid,
    's6666666-6666-6666-6666-666666666666'::uuid
  ];
  student_names TEXT[][] := ARRAY[
    ARRAY['Emma', 'Johnson'],
    ARRAY['Liam', 'Chen'],
    ARRAY['Sophia', 'Rodriguez'],
    ARRAY['Noah', 'Williams'],
    ARRAY['Ava', 'Thompson'],
    ARRAY['Ethan', 'Davis']
  ];
  class_ids UUID[] := ARRAY[
    'c1111111-1111-1111-1111-111111111111'::uuid,
    'c2222222-2222-2222-2222-222222222222'::uuid,
    'c3333333-3333-3333-3333-333333333333'::uuid
  ];
  grade_levels TEXT[] := ARRAY['4th Grade', '5th Grade', '6th Grade'];
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    -- Insert student profile
    INSERT INTO profiles (
      id,
      user_id,
      first_name,
      last_name,
      role,
      school_id,
      class_id,
      grade_level,
      xp_points,
      level_number,
      streak_days,
      wellbeing_status,
      current_mood,
      gems
    ) VALUES (
      gen_random_uuid(),
      student_users[i],
      student_names[i][1],
      student_names[i][2],
      'student',
      'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
      class_ids[(i % 3) + 1],
      grade_levels[(i % 3) + 1],
      1500 + (i * 300),
      8 + i,
      5 + i,
      CASE i % 3
        WHEN 0 THEN 'thriving'
        WHEN 1 THEN 'managing'
        WHEN 2 THEN 'needs_support'
      END,
      CASE i % 4
        WHEN 0 THEN 'happy'
        WHEN 1 THEN 'calm'
        WHEN 2 THEN 'excited'
        WHEN 3 THEN 'neutral'
      END,
      50 + (i * 20)
    ) ON CONFLICT (user_id) DO NOTHING;

    -- Create subject progress for each student
    INSERT INTO subject_progress (student_id, subject_name, progress_percentage, letter_grade) VALUES
    (student_users[i], 'Mathematics', 60 + (RANDOM() * 40)::INTEGER, 
     CASE WHEN (60 + (RANDOM() * 40)::INTEGER) >= 90 THEN 'A' 
          WHEN (60 + (RANDOM() * 40)::INTEGER) >= 80 THEN 'B' 
          ELSE 'C' END),
    (student_users[i], 'Science', 60 + (RANDOM() * 40)::INTEGER,
     CASE WHEN (60 + (RANDOM() * 40)::INTEGER) >= 90 THEN 'A' 
          WHEN (60 + (RANDOM() * 40)::INTEGER) >= 80 THEN 'B' 
          ELSE 'C' END),
    (student_users[i], 'English', 60 + (RANDOM() * 40)::INTEGER,
     CASE WHEN (60 + (RANDOM() * 40)::INTEGER) >= 90 THEN 'A' 
          WHEN (60 + (RANDOM() * 40)::INTEGER) >= 80 THEN 'B' 
          ELSE 'C' END),
    (student_users[i], 'Social Studies', 60 + (RANDOM() * 40)::INTEGER,
     CASE WHEN (60 + (RANDOM() * 40)::INTEGER) >= 90 THEN 'A' 
          WHEN (60 + (RANDOM() * 40)::INTEGER) >= 80 THEN 'B' 
          ELSE 'C' END)
    ON CONFLICT (student_id, subject_name) DO NOTHING;
  END LOOP;
END $$;

-- Verify the setup
SELECT 'Admin Profile Created' as status, first_name, last_name, role, school_id 
FROM profiles 
WHERE user_id = auth.uid();

SELECT 'School Created' as status, name, school_code 
FROM schools 
WHERE id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid;

SELECT 'Students Created' as status, COUNT(*) as student_count 
FROM profiles 
WHERE role = 'student' AND school_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid;
