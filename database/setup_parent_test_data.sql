-- Setup Test Data for Parent Dashboard
-- Run this to link a parent to their children for testing

-- First, verify the tables exist and check current data
SELECT 'Checking parent_child_relationships...' as status;
SELECT COUNT(*) as relationship_count FROM parent_child_relationships;

-- Check if we have any parents and students
SELECT 'Parents in system:' as status;
SELECT id, email, first_name, last_name, role 
FROM profiles 
WHERE role = 'parent' 
LIMIT 5;

SELECT 'Students in system:' as status;
SELECT id, email, first_name, last_name, role, grade 
FROM profiles 
WHERE role = 'student' 
LIMIT 5;

-- Example: Link a parent to a student (REPLACE WITH ACTUAL IDs)
-- Uncomment and update these lines with real IDs from the queries above:

/*
INSERT INTO parent_child_relationships (parent_id, child_id)
VALUES 
  ('YOUR_PARENT_PROFILE_ID_HERE', 'YOUR_STUDENT_PROFILE_ID_HERE')
ON CONFLICT (parent_id, child_id) DO NOTHING;
*/

-- Verify the relationship was created
SELECT 
  pcr.id,
  parent.email as parent_email,
  parent.first_name as parent_name,
  child.email as child_email,
  child.first_name as child_name,
  child.grade
FROM parent_child_relationships pcr
JOIN profiles parent ON parent.id = pcr.parent_id
JOIN profiles child ON child.id = pcr.child_id
ORDER BY pcr.created_at DESC
LIMIT 10;
