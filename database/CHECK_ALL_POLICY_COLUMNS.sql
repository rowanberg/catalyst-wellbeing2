-- Comprehensive check for ALL columns referenced in FIX_REMAINING_DUPLICATES.sql
-- Returns TRUE/FALSE for each column we're trying to use

SELECT 
    'student_shout_outs' as table_name,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'student_shout_outs' AND column_name = 'student_id') as has_student_id,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'student_shout_outs' AND column_name = 'is_public') as has_is_public,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'student_shout_outs' AND column_name = 'school_id') as has_school_id
UNION ALL
SELECT 
    'assessments',
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'assessments' AND column_name = 'teacher_id'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'assessments' AND column_name = 'is_published'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'assessments' AND column_name = 'class_id')
UNION ALL
SELECT 
    'custom_quests',
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'custom_quests' AND column_name = 'created_by'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'custom_quests' AND column_name = 'is_active'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'custom_quests' AND column_name = 'school_id')
UNION ALL
SELECT 
    'management_messages',
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'management_messages' AND column_name = 'sender_id'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'management_messages' AND column_name = 'recipient_id'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'management_messages' AND column_name = 'school_id')
UNION ALL
SELECT 
    'assessment_analytics',
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'assessment_analytics' AND column_name = 'assessment_id'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'assessment_analytics' AND column_name = 'teacher_id'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'assessment_analytics' AND column_name = 'school_id')
UNION ALL
SELECT 
    'examinations',
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'examinations' AND column_name = 'teacher_id'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'examinations' AND column_name = 'is_published'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'examinations' AND column_name = 'class_id')
UNION ALL
SELECT 
    'gem_transactions',
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gem_transactions' AND column_name = 'student_id'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gem_transactions' AND column_name = 'teacher_id'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gem_transactions' AND column_name = 'school_id')
UNION ALL
SELECT 
    'help_requests',
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'help_requests' AND column_name = 'student_id'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'help_requests' AND column_name = 'teacher_id'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'help_requests' AND column_name = 'school_id')
UNION ALL
SELECT 
    'intervention_feedback',
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'intervention_feedback' AND column_name = 'implementation_id'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'intervention_feedback' AND column_name = 'teacher_id'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'intervention_feedback' AND column_name = 'school_id')
UNION ALL
SELECT 
    'math_battle_progress',
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'math_battle_progress' AND column_name = 'student_id'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'math_battle_progress' AND column_name = 'level_id'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'math_battle_progress' AND column_name = 'school_id')
UNION ALL
SELECT 
    'polls',
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'polls' AND column_name = 'is_active'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'polls' AND column_name = 'status'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'polls' AND column_name = 'target_roles')
UNION ALL
SELECT 
    'school_gemini_config',
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'school_gemini_config' AND column_name = 'school_id'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'school_gemini_config' AND column_name = 'config_id'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'school_gemini_config' AND column_name = 'created_by')
UNION ALL
SELECT 
    'teacher_office_hours',
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'teacher_office_hours' AND column_name = 'teacher_id'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'teacher_office_hours' AND column_name = 'is_active'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'teacher_office_hours' AND column_name = 'school_id')
UNION ALL
SELECT 
    'teacher_settings',
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'teacher_settings' AND column_name = 'teacher_id'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'teacher_settings' AND column_name = 'user_id'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'teacher_settings' AND column_name = 'school_id')
UNION ALL
SELECT 
    'wellbeing_assessments',
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'wellbeing_assessments' AND column_name = 'student_id'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'wellbeing_assessments' AND column_name = 'teacher_id'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'wellbeing_assessments' AND column_name = 'school_id');

-- Also get full column list for problem tables
SELECT 
    table_name,
    string_agg(column_name, ', ' ORDER BY ordinal_position) as all_columns
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name IN (
    'assessment_analytics',
    'gem_transactions', 
    'math_battle_progress',
    'intervention_feedback',
    'polls',
    'teacher_settings'
  )
GROUP BY table_name
ORDER BY table_name;
