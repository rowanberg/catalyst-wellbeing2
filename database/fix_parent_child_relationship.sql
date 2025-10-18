-- Fix missing parent-child relationship
-- Parent: 6f53cbef-23d0-4fd6-95a8-ce8c76c0bc62
-- Child: 36d15ff5-52a8-4b94-91ee-c81c0e4f4387

-- Check if relationship already exists
SELECT * FROM parent_child_relationships
WHERE parent_id = '6f53cbef-23d0-4fd6-95a8-ce8c76c0bc62'
AND child_id = '36d15ff5-52a8-4b94-91ee-c81c0e4f4387';

-- Insert parent-child relationship
INSERT INTO parent_child_relationships (parent_id, child_id, created_at, updated_at)
VALUES (
  '6f53cbef-23d0-4fd6-95a8-ce8c76c0bc62',
  '36d15ff5-52a8-4b94-91ee-c81c0e4f4387',
  NOW(),
  NOW()
)
ON CONFLICT (parent_id, child_id) DO NOTHING;

-- Verify the relationship was created
SELECT 
  pcr.id,
  pcr.parent_id,
  pcr.child_id,
  p1.first_name || ' ' || p1.last_name as parent_name,
  p2.first_name || ' ' || p2.last_name as child_name
FROM parent_child_relationships pcr
JOIN profiles p1 ON p1.id = pcr.parent_id
JOIN profiles p2 ON p2.id = pcr.child_id
WHERE pcr.parent_id = '6f53cbef-23d0-4fd6-95a8-ce8c76c0bc62'
AND pcr.child_id = '36d15ff5-52a8-4b94-91ee-c81c0e4f4387';
