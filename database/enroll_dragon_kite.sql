-- Enroll Dragon kite into a class
-- Student: 36d15ff5-52a8-4b94-91ee-c81c0e4f4387
-- School: f2baa26b-ad79-4576-bead-e57dc942e4f8

-- Option 1: Enroll in "jebin" class
INSERT INTO student_classes (student_id, class_id, created_at)
VALUES (
  '36d15ff5-52a8-4b94-91ee-c81c0e4f4387',
  '39b2f519-c0d1-4915-8773-36a9254f7016',  -- jebin class
  NOW()
)
ON CONFLICT (student_id, class_id) DO NOTHING;

-- Verify enrollment
SELECT 
  sc.*,
  c.class_name,
  p.first_name || ' ' || p.last_name as student_name
FROM student_classes sc
JOIN classes c ON c.id = sc.class_id
JOIN profiles p ON p.id = sc.student_id
WHERE sc.student_id = '36d15ff5-52a8-4b94-91ee-c81c0e4f4387';
