-- Debug script to check JEBIN's school setup data
-- Run this in Supabase SQL Editor to see what data exists

-- 1. Check JEBIN's profile information
SELECT 
  id,
  user_id,
  first_name,
  last_name,
  role,
  school_id,
  school_code,
  created_at,
  updated_at
FROM profiles 
WHERE first_name = 'JEBIN' AND last_name = 'ANDREW';

-- 2. Check schools table for JEBIN's school
SELECT 
  s.id,
  s.name,
  s.school_code,
  s.created_at
FROM schools s
JOIN profiles p ON p.school_id = s.id
WHERE p.first_name = 'JEBIN' AND p.last_name = 'ANDREW';

-- 3. Check school_details for JEBIN's school (by school_id)
SELECT 
  sd.id,
  sd.school_id,
  sd.school_code,
  sd.school_name,
  sd.status,
  sd.setup_completed,
  sd.setup_completed_at,
  sd.setup_completed_by,
  sd.created_at,
  sd.updated_at
FROM school_details sd
JOIN profiles p ON p.school_id = sd.school_id
WHERE p.first_name = 'JEBIN' AND p.last_name = 'ANDREW';

-- 4. Check school_details for JEBIN's school (by school_code if different)
SELECT 
  sd.id,
  sd.school_id,
  sd.school_code,
  sd.school_name,
  sd.status,
  sd.setup_completed,
  sd.setup_completed_at,
  sd.setup_completed_by,
  sd.created_at,
  sd.updated_at
FROM school_details sd
JOIN schools s ON s.school_code = sd.school_code
JOIN profiles p ON p.school_id = s.id
WHERE p.first_name = 'JEBIN' AND p.last_name = 'ANDREW';

-- 5. Show ALL school_details records to see what exists
SELECT 
  id,
  school_id,
  school_code,
  school_name,
  status,
  setup_completed,
  setup_completed_at
FROM school_details
ORDER BY created_at DESC
LIMIT 10;

-- 6. Show ALL schools to see what exists
SELECT 
  id,
  name,
  school_code,
  created_at
FROM schools
ORDER BY created_at DESC
LIMIT 10;
