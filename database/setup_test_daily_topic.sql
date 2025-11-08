-- =============================================
-- Quick Test Setup for Daily Topics
-- =============================================
-- This will create a test topic for today
-- =============================================

-- Step 1: Apply the schema if not already done
-- (Skip if you already ran daily_topics_schema.sql)
\i daily_topics_schema.sql

-- Step 2: Get a teacher user ID
-- IMPORTANT: Replace this with an actual teacher ID from your database
DO $$
DECLARE
  v_teacher_id UUID;
  v_school_id UUID := 'f2baa26b-ad79-4576-bead-e57dc942e4f8'; -- Your school ID from the data
  v_class_id UUID := '39b2f519-c0d1-4915-8773-36a9254f7016'; -- "jebin" class
BEGIN
  -- Get first teacher for this school
  SELECT user_id INTO v_teacher_id
  FROM profiles
  WHERE role = 'teacher'
  AND school_id = v_school_id
  LIMIT 1;

  IF v_teacher_id IS NULL THEN
    RAISE NOTICE '❌ No teacher found for school. Please create a teacher first.';
    RETURN;
  END IF;

  RAISE NOTICE '✅ Using teacher ID: %', v_teacher_id;
  
  -- Insert or update today's topic
  INSERT INTO daily_topics (
    teacher_id,
    class_id,
    school_id,
    topic,
    topic_date
  )
  VALUES (
    v_teacher_id,
    v_class_id,
    v_school_id,
    'Introduction to Quadratic Equations - Factoring Methods',
    CURRENT_DATE
  )
  ON CONFLICT (teacher_id, class_id, topic_date)
  DO UPDATE SET
    topic = EXCLUDED.topic,
    updated_at = NOW()
  RETURNING 
    id,
    topic,
    topic_date,
    created_at = updated_at as is_new;

  RAISE NOTICE '✅ Topic created/updated successfully!';
  
END $$;

-- Step 3: Verify the topic was created
SELECT 
  dt.topic,
  dt.topic_date,
  c.class_name,
  c.subject,
  p.first_name || ' ' || p.last_name as teacher_name
FROM daily_topics dt
JOIN classes c ON dt.class_id = c.id
JOIN profiles p ON dt.teacher_id = p.user_id
WHERE dt.topic_date = CURRENT_DATE;

-- Step 4: Assign a test student to the class (if needed)
-- Find students without classes and assign them
UPDATE profiles
SET class_id = '39b2f519-c0d1-4915-8773-36a9254f7016' -- "jebin" class
WHERE role = 'student'
AND school_id = 'f2baa26b-ad79-4576-bead-e57dc942e4f8'
AND class_id IS NULL
LIMIT 1
RETURNING user_id, first_name, last_name, class_id;

-- Step 5: Verify students can see the topic
SELECT 
  'Student Assignment Check' as check_type,
  COUNT(*) as students_in_jebin_class
FROM profiles
WHERE role = 'student'
AND class_id = '39b2f519-c0d1-4915-8773-36a9254f7016';

-- Done!
SELECT '✅ Setup Complete! Now test the homework helper as a student.' as status;
