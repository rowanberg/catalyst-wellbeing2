-- Check and fix student-school associations
-- Admin school_id: f2baa26b-ad79-4576-bead-e57dc942e4f8

-- Step 1: Check current students and their school associations
SELECT 
  id,
  first_name,
  last_name,
  role,
  school_id,
  xp,
  gems,
  level
FROM profiles 
WHERE role = 'student'
ORDER BY first_name;

-- Step 2: Check the admin's school
SELECT 
  id,
  name,
  school_code
FROM schools 
WHERE id = 'f2baa26b-ad79-4576-bead-e57dc942e4f8';

-- Step 3: Update students to belong to the admin's school
UPDATE profiles 
SET school_id = 'f2baa26b-ad79-4576-bead-e57dc942e4f8'
WHERE role = 'student' AND school_id IS NULL;

-- Step 4: If students have different school_id, update them
UPDATE profiles 
SET school_id = 'f2baa26b-ad79-4576-bead-e57dc942e4f8'
WHERE role = 'student' AND school_id != 'f2baa26b-ad79-4576-bead-e57dc942e4f8';

-- Step 5: Verify the fix
SELECT 
  id,
  first_name,
  last_name,
  role,
  school_id,
  xp,
  gems,
  level
FROM profiles 
WHERE role = 'student' AND school_id = 'f2baa26b-ad79-4576-bead-e57dc942e4f8'
ORDER BY first_name;
