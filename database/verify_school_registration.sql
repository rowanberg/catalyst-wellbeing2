-- Verification script to check if school registration is working properly
-- Run this in Supabase SQL Editor after testing registration

-- 1. Check if school_details table exists and has the right structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'school_details' 
ORDER BY ordinal_position;

-- 2. Check recent school registrations in schools table
SELECT 
    id,
    name,
    school_code,
    admin_id,
    created_at
FROM schools 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Check corresponding school_details records
SELECT 
    sd.id,
    sd.school_name,
    sd.school_code,
    sd.setup_completed,
    sd.created_at,
    s.name as school_table_name
FROM school_details sd
JOIN schools s ON sd.school_id = s.id
ORDER BY sd.created_at DESC 
LIMIT 5;

-- 4. Check admin profiles for recent schools
SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.role,
    p.school_id,
    s.name as school_name,
    s.school_code
FROM profiles p
JOIN schools s ON p.school_id = s.id
WHERE p.role = 'admin'
ORDER BY p.created_at DESC
LIMIT 5;

-- 5. Verify RLS policies are working
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('schools', 'school_details', 'profiles')
ORDER BY tablename, policyname;
