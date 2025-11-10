-- Run this in your Supabase SQL Editor to debug

-- 1. Check all shout-outs in the database
SELECT 
  id,
  school_id,
  student_id,
  teacher_id,
  category,
  message,
  is_public,
  created_at
FROM student_shout_outs
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check the student's profile and school_id
SELECT 
  p.id as profile_id,
  p.user_id,
  p.school_id,
  p.role,
  p.first_name,
  p.last_name
FROM profiles p
WHERE p.role = 'student'
AND (p.first_name ILIKE '%rowan%' OR p.last_name ILIKE '%berg%')
LIMIT 5;

-- 3. Check the teacher's profile and school_id
SELECT 
  p.id as profile_id,
  p.user_id,
  p.school_id,
  p.role,
  p.first_name,
  p.last_name
FROM profiles p
WHERE p.role = 'teacher'
AND (p.first_name ILIKE '%jerin%' OR p.first_name ILIKE '%ancia%')
LIMIT 5;

-- 4. Check if student and teacher have matching school_ids
SELECT DISTINCT
  so.id as shoutout_id,
  so.school_id as shoutout_school_id,
  so.is_public,
  so.created_at,
  sp.school_id as student_school_id,
  tp.school_id as teacher_school_id,
  sp.first_name as student_name,
  tp.first_name as teacher_name
FROM student_shout_outs so
LEFT JOIN profiles sp ON sp.id = so.student_id
LEFT JOIN profiles tp ON tp.id = so.teacher_id
ORDER BY so.created_at DESC
LIMIT 10;
