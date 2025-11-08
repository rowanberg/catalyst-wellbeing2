-- ============================================
-- Fix Teacher Profile Issue
-- ============================================
-- This script checks if the authenticated user exists in profiles table
-- and helps debug the foreign key constraint issue

-- Step 1: Check current authenticated user
SELECT 
    auth.uid() as current_user_id,
    auth.email() as current_user_email;

-- Step 2: Check if user exists in profiles table
SELECT 
    id,
    email,
    role,
    first_name,
    last_name
FROM profiles
WHERE id = auth.uid();

-- Step 3: Check all teacher profiles
SELECT 
    id,
    email,
    role,
    first_name,
    last_name
FROM profiles
WHERE role = 'teacher';

-- Step 4: If your profile doesn't exist, uncomment and run this to create it:
/*
INSERT INTO profiles (
    id,
    email,
    role,
    first_name,
    last_name
)
VALUES (
    auth.uid(),                    -- Uses your current authenticated user ID
    auth.email(),                  -- Uses your current email
    'teacher',                     -- Set role as teacher
    'Your First Name',             -- REPLACE with your actual first name
    'Your Last Name'               -- REPLACE with your actual last name
)
ON CONFLICT (id) DO UPDATE
SET role = 'teacher';
*/

-- Step 5: Verify the fix
SELECT 
    'Profile exists: ' || CASE 
        WHEN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()) 
        THEN 'YES ✓' 
        ELSE 'NO ✗' 
    END as status;
