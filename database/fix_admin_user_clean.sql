-- Clean fix for admin user setup and school association
-- This script ensures the admin user has proper school access for the students API

-- Step 1: Ensure schools table has school_code column
ALTER TABLE schools ADD COLUMN IF NOT EXISTS school_code VARCHAR(50);

-- Step 2: Create or update the test school with proper school_code
INSERT INTO schools (id, name, school_code, address, phone, email, admin_id, messaging_encryption_key)
VALUES (
  gen_random_uuid(),
  'Test School',
  'TEST001',
  '123 Test Street',
  '+1234567890',
  'admin@testschool.edu',
  '082f24d3-9f21-4330-8864-fe5c52316c0f',
  encode(gen_random_bytes(32), 'hex')
) ON CONFLICT (school_code) DO UPDATE SET
  admin_id = EXCLUDED.admin_id;

-- Step 3: Ensure profiles table has school_code column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS school_code VARCHAR(50);

-- Step 4: Get the school ID and update admin user
WITH school_data AS (
  SELECT id as school_id, school_code FROM schools WHERE school_code = 'TEST001' LIMIT 1
)
UPDATE profiles 
SET 
  role = 'admin',
  school_id = (SELECT school_id FROM school_data),
  school_code = (SELECT school_code FROM school_data),
  updated_at = NOW()
WHERE user_id = '082f24d3-9f21-4330-8864-fe5c52316c0f';

-- Step 5: Create test students with static data
INSERT INTO profiles (id, user_id, first_name, last_name, role, school_id, school_code, xp, gems, level)
VALUES 
  (gen_random_uuid(), gen_random_uuid(), 'Alice', 'Johnson', 'student', (SELECT id FROM schools WHERE school_code = 'TEST001'), 'TEST001', 250, 45, 1),
  (gen_random_uuid(), gen_random_uuid(), 'Bob', 'Smith', 'student', (SELECT id FROM schools WHERE school_code = 'TEST001'), 'TEST001', 420, 67, 2),
  (gen_random_uuid(), gen_random_uuid(), 'Charlie', 'Brown', 'student', (SELECT id FROM schools WHERE school_code = 'TEST001'), 'TEST001', 180, 32, 1),
  (gen_random_uuid(), gen_random_uuid(), 'Diana', 'Davis', 'student', (SELECT id FROM schools WHERE school_code = 'TEST001'), 'TEST001', 650, 89, 3),
  (gen_random_uuid(), gen_random_uuid(), 'Eve', 'Wilson', 'student', (SELECT id FROM schools WHERE school_code = 'TEST001'), 'TEST001', 340, 56, 2)
ON CONFLICT (user_id) DO NOTHING;

-- Step 6: Verify the admin setup
SELECT 
  p.id,
  p.role,
  p.school_id,
  p.school_code,
  s.name as school_name,
  s.school_code as school_code_from_schools
FROM profiles p
LEFT JOIN schools s ON p.school_id = s.id
WHERE p.user_id = '082f24d3-9f21-4330-8864-fe5c52316c0f';

-- Step 7: Show test students created
SELECT 
  first_name,
  last_name,
  school_code,
  xp,
  level,
  gems
FROM profiles 
WHERE role = 'student' AND school_code = 'TEST001'
ORDER BY last_name;
