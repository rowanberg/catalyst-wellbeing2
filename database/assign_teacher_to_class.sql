-- Quick script to assign teacher to a class for testing shout-outs
-- Replace the IDs with actual values from your database

-- First, check if there are any classes in the school
SELECT id, class_name, subject, school_id 
FROM classes 
WHERE school_id = (
  SELECT school_id 
  FROM profiles 
  WHERE id = 'c7a9ce2b-d359-4257-9e0b-afe5b02faa6f'
);

-- If classes exist, assign teacher to a class
-- Replace 'CLASS_ID_HERE' with an actual class ID from the query above
INSERT INTO teacher_class_assignments (
  teacher_id,
  class_id,
  is_primary_teacher,
  subject,
  is_active,
  assigned_at
) VALUES (
  'c7a9ce2b-d359-4257-9e0b-afe5b02faa6f',  -- Teacher ID
  'CLASS_ID_HERE',                          -- Replace with actual class ID
  true,                                     -- Primary teacher
  'General',                                -- Subject
  true,                                     -- Active
  NOW()                                     -- Current timestamp
);

-- Verify the assignment
SELECT 
  tca.*,
  c.class_name,
  c.subject as class_subject
FROM teacher_class_assignments tca
JOIN classes c ON tca.class_id = c.id
WHERE tca.teacher_id = 'c7a9ce2b-d359-4257-9e0b-afe5b02faa6f';
