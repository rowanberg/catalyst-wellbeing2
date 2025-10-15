-- Debug query to see what the API should return
-- Run this to see if RLS is blocking the query

-- First, get the parent's user_id
SELECT 
  id as profile_id,
  user_id,
  first_name,
  last_name
FROM profiles 
WHERE id = '7521748d-79ad-44de-ac61-b69f68b1a899';

-- Then check relationships using that user_id
SELECT 
  pcr.id,
  pcr.parent_id,
  pcr.child_id,
  child.first_name,
  child.last_name,
  child.level
FROM parent_child_relationships pcr
LEFT JOIN profiles child ON child.id = pcr.child_id
WHERE pcr.parent_id = '43278788-3a2c-4b5f-bf37-42390f63fd8d';

-- Check if RLS is enabled on parent_child_relationships
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'parent_child_relationships';

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'parent_child_relationships';
