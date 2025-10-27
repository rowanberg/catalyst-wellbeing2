-- Debug script to find school_id mismatch
-- Run this in Supabase SQL Editor while logged in as the student

-- Step 1: Find the current student's profile and school
SELECT 
    p.id as profile_id,
    p.user_id,
    p.school_id as student_school_id,
    p.role,
    s.name as school_name
FROM profiles p
LEFT JOIN schools s ON s.id = p.school_id
WHERE p.user_id = auth.uid();

-- Step 2: Count announcements in student's school
SELECT 
    COUNT(*) as total_announcements,
    COUNT(*) FILTER (WHERE target_audience = 'all') as targeted_to_all,
    COUNT(*) FILTER (WHERE target_audience = 'students') as targeted_to_students,
    COUNT(*) FILTER (WHERE is_active = true) as active_announcements
FROM school_announcements sa
WHERE sa.school_id = (
    SELECT school_id FROM profiles WHERE user_id = auth.uid()
);

-- Step 3: Check if RLS is blocking (should return same results as student sees)
SELECT 
    id,
    title,
    school_id,
    target_audience,
    is_active,
    expires_at,
    created_at
FROM school_announcements
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 10;

-- Step 4: Check all announcements (admin view - bypasses RLS)
-- This shows what announcements exist in the database
SET LOCAL ROLE postgres; -- Bypass RLS temporarily
SELECT 
    sa.id,
    sa.title,
    sa.school_id,
    s.name as school_name,
    sa.target_audience,
    sa.is_active
FROM school_announcements sa
LEFT JOIN schools s ON s.id = sa.school_id
WHERE sa.is_active = true
ORDER BY sa.created_at DESC;
RESET ROLE; -- Back to normal
