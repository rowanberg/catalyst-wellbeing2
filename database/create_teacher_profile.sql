-- ============================================
-- Create Teacher Profile for Current User
-- ============================================
-- This creates a profile entry with user_id = auth.uid()

-- Step 1: Check current user and profile status
SELECT 
    auth.uid() as auth_user_id,
    auth.email() as auth_email,
    p.id as profile_id,
    p.user_id as profile_user_id,
    p.role as profile_role,
    p.first_name,
    p.last_name
FROM auth.users au
LEFT JOIN profiles p ON p.user_id = au.id
WHERE au.id = auth.uid();

-- Step 2: Get your school_id (you'll need this)
-- Replace 'Your School Name' with your actual school name
SELECT id, school_name FROM schools LIMIT 5;

-- Step 3: Create profile (CUSTOMIZE THIS WITH YOUR DATA)
-- IMPORTANT: Replace the values below with your actual data
INSERT INTO profiles (
    user_id,
    first_name,
    last_name,
    email,
    role,
    school_id,            -- GET THIS FROM STEP 2
    created_at,
    updated_at
)
VALUES (
    auth.uid(),
    'John',               -- CHANGE: Your first name
    'Doe',                -- CHANGE: Your last name  
    auth.email(),
    'teacher',
    (SELECT id FROM schools LIMIT 1),  -- CHANGE: Use actual school_id from Step 2
    NOW(),
    NOW()
)
ON CONFLICT (user_id) DO UPDATE
SET 
    role = 'teacher',
    updated_at = NOW()
RETURNING *;

-- Step 4: Verify the profile was created
SELECT 
    id,
    user_id,
    first_name,
    last_name,
    email,
    role,
    school_id
FROM profiles
WHERE user_id = auth.uid();
