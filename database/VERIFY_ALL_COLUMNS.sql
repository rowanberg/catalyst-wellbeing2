-- Comprehensive column verification for all tables in FIX_REMAINING_DUPLICATES.sql
-- This will show which columns actually exist in each table

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name IN (
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
    'wellbeing_assessments'
  )
  AND column_name LIKE '%_id'
ORDER BY table_name, ordinal_position;

-- Quick check for specific problematic columns
SELECT 
    'math_battle_progress' as table_name,
    EXISTS (SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'math_battle_progress' 
            AND column_name = 'school_id') as has_school_id,
    EXISTS (SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'math_battle_progress' 
            AND column_name = 'student_id') as has_student_id;
