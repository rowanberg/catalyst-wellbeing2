-- Check which duplicate policies CURRENTLY exist in the database
SELECT 
    tablename,
    cmd as command,
    COUNT(*) as policy_count,
    string_agg(policyname, ' | ' ORDER BY policyname) as policy_names
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename, cmd, roles
HAVING COUNT(*) > 1
ORDER BY policy_count DESC, tablename;

-- Also show all SELECT policies to see what exists
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd = 'SELECT'
  AND tablename IN (
    'student_shout_outs',
    'assessments',
    'custom_quests',
    'management_messages',
    'student_class_assignments',
    'teacher_class_assignments',
    'subject_progress',
    'teacher_settings',
    'polls',
    'poll_responses'
  )
ORDER BY tablename, policyname;
