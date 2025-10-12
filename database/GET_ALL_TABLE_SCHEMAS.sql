-- Get complete schema for ALL tables used in FIX_REMAINING_DUPLICATES.sql
-- This will show EXACTLY which columns exist

SELECT 
    c.table_name,
    string_agg(c.column_name || ' (' || c.data_type || ')', ', ' ORDER BY c.ordinal_position) as all_columns
FROM information_schema.columns c
WHERE c.table_schema = 'public' 
  AND c.table_name IN (
    'student_shout_outs',
    'assessments',
    'custom_quests',
    'management_messages',
    'student_class_assignments',
    'teacher_class_assignments',
    'assessment_analytics',
    'assessment_grades',
    'custom_badges',
    'examinations',
    'gem_transactions',
    'help_requests',
    'intervention_feedback',
    'intervention_implementations',
    'math_battle_progress',
    'office_hours_conversations',
    'office_hours_messages',
    'parent_child_relationships',
    'poll_responses',
    'polls',
    'school_gemini_config',
    'schools',
    'student_badge_achievements',
    'student_moods',
    'student_quest_progress',
    'student_recognition_stats',
    'subject_progress',
    'teacher_intervention_stats',
    'teacher_office_hours',
    'teacher_settings',
    'user_sessions',
    'wellbeing_assessments'
  )
GROUP BY c.table_name
ORDER BY c.table_name;

-- Get ALL existing policies for these tables
SELECT 
    tablename,
    policyname,
    cmd,
    LEFT(qual, 200) as using_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'student_shout_outs',
    'assessments',
    'custom_quests',
    'management_messages',
    'student_class_assignments',
    'teacher_class_assignments',
    'assessment_analytics',
    'assessment_grades',
    'custom_badges',
    'examinations',
    'gem_transactions',
    'help_requests',
    'intervention_feedback',
    'intervention_implementations',
    'math_battle_progress',
    'office_hours_conversations',
    'office_hours_messages',
    'parent_child_relationships',
    'poll_responses',
    'polls',
    'school_gemini_config',
    'schools',
    'student_badge_achievements',
    'student_moods',
    'student_quest_progress',
    'student_recognition_stats',
    'subject_progress',
    'teacher_intervention_stats',
    'teacher_office_hours',
    'teacher_settings',
    'user_sessions',
    'wellbeing_assessments'
  )
ORDER BY tablename, cmd, policyname;
