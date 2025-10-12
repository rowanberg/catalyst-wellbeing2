-- Verify which tables use user_id vs profile_id
-- This helps identify auth.uid() vs profiles.id mismatches

-- Check student_shout_outs schema
SELECT column_name, data_type, 
       CASE 
           WHEN column_name LIKE '%student_id%' THEN 'Check if references profiles.id or auth.users.id'
           WHEN column_name LIKE '%teacher_id%' THEN 'Check if references profiles.id or auth.users.id'
           WHEN column_name LIKE '%user_id%' THEN 'Likely auth.users.id'
       END as note
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'student_shout_outs'
  AND column_name LIKE '%_id'
ORDER BY ordinal_position;

-- Check foreign key constraints to determine ID type
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('student_shout_outs', 'assessments', 'student_moods', 'student_quest_progress')
ORDER BY tc.table_name, kcu.column_name;
