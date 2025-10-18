-- Debug parent-child relationship issue
-- Check what's actually in the parent_child_relationships table

-- 1. Check all relationships for this parent (by profile id)
SELECT 
  pcr.*,
  p_parent.first_name || ' ' || p_parent.last_name as parent_name,
  p_parent.user_id as parent_user_id,
  p_child.first_name || ' ' || p_child.last_name as child_name,
  p_child.user_id as child_user_id
FROM parent_child_relationships pcr
LEFT JOIN profiles p_parent ON p_parent.id = pcr.parent_id
LEFT JOIN profiles p_child ON p_child.id = pcr.child_id
WHERE pcr.parent_id = '6f53cbef-23d0-4fd6-95a8-ce8c76c0bc62';

-- 2. Check if maybe it's storing user_id instead of profile id
SELECT * FROM parent_child_relationships
WHERE parent_id = '59617679-eccb-47d3-8543-70a19848e0a5' -- parent user_id
OR child_id = '36d15ff5-52a8-4b94-91ee-c81c0e4f4387';

-- 3. Check the profiles table structure
SELECT id, user_id, first_name, last_name, role 
FROM profiles 
WHERE user_id = '59617679-eccb-47d3-8543-70a19848e0a5' -- parent
OR id = '36d15ff5-52a8-4b94-91ee-c81c0e4f4387'; -- child

-- 4. Check all relationships in the table
SELECT 
  pcr.id,
  pcr.parent_id,
  pcr.child_id,
  p_parent.user_id as parent_user_id,
  p_child.user_id as child_user_id
FROM parent_child_relationships pcr
LEFT JOIN profiles p_parent ON p_parent.id = pcr.parent_id
LEFT JOIN profiles p_child ON p_child.id = pcr.child_id
LIMIT 10;
