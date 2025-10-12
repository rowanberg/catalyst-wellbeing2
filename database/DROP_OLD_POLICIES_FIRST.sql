-- Drop all old duplicate policies FIRST before creating consolidated ones
-- Run this before running FIX_REMAINING_DUPLICATES.sql

-- STUDENT_SHOUT_OUTS
DROP POLICY IF EXISTS "Admins can view all shout-outs in their school" ON public.student_shout_outs;
DROP POLICY IF EXISTS "Public shout-outs visible to school community" ON public.student_shout_outs;
DROP POLICY IF EXISTS "Students can view shout-outs about themselves" ON public.student_shout_outs;
DROP POLICY IF EXISTS "Teachers can view shout-outs in their school" ON public.student_shout_outs;

-- ASSESSMENTS
DROP POLICY IF EXISTS "Admins can view school assessments" ON public.assessments;
DROP POLICY IF EXISTS "Students can view published assessments" ON public.assessments;
DROP POLICY IF EXISTS "Teachers can view own assessments" ON public.assessments;

-- CUSTOM_QUESTS
DROP POLICY IF EXISTS "Admins can view all quests in their school" ON public.custom_quests;
DROP POLICY IF EXISTS "Students can view active quests in their school" ON public.custom_quests;
DROP POLICY IF EXISTS "Teachers can view their own quests" ON public.custom_quests;

-- MANAGEMENT_MESSAGES
DROP POLICY IF EXISTS "Staff can read school messages" ON public.management_messages;
DROP POLICY IF EXISTS "Staff can read sent messages" ON public.management_messages;
DROP POLICY IF EXISTS "Students can read own messages" ON public.management_messages;

-- STUDENT_CLASS_ASSIGNMENTS
DROP POLICY IF EXISTS "Admins can view all student class assignments" ON public.student_class_assignments;
DROP POLICY IF EXISTS "Students can view their own class assignments" ON public.student_class_assignments;
DROP POLICY IF EXISTS "Teachers can view class assignments for their classes" ON public.student_class_assignments;

-- TEACHER_CLASS_ASSIGNMENTS
DROP POLICY IF EXISTS "Teachers can view their own assignments" ON public.teacher_class_assignments;
DROP POLICY IF EXISTS "Teachers can view their own class assignments" ON public.teacher_class_assignments;
DROP POLICY IF EXISTS "Users can view teacher assignments from their school" ON public.teacher_class_assignments;

-- ASSESSMENT_ANALYTICS
DROP POLICY IF EXISTS "Admins can view school analytics" ON public.assessment_analytics;
DROP POLICY IF EXISTS "Teachers can view own assessment analytics" ON public.assessment_analytics;

-- ASSESSMENT_GRADES
DROP POLICY IF EXISTS "Assessment grades view access" ON public.assessment_grades;
DROP POLICY IF EXISTS "Students can view own grades" ON public.assessment_grades;

-- CUSTOM_BADGES
DROP POLICY IF EXISTS "School community can view active badges" ON public.custom_badges;
DROP POLICY IF EXISTS "Teachers can view their own badges" ON public.custom_badges;

-- EXAMINATIONS
DROP POLICY IF EXISTS "Admins can view school exams" ON public.examinations;
DROP POLICY IF EXISTS "Students can view published exams in their classes" ON public.examinations;

-- GEM_TRANSACTIONS
DROP POLICY IF EXISTS "Students can view their transactions" ON public.gem_transactions;
DROP POLICY IF EXISTS "Teachers can view their own transactions" ON public.gem_transactions;

-- HELP_REQUESTS
DROP POLICY IF EXISTS "Students can view own help requests" ON public.help_requests;
DROP POLICY IF EXISTS "Teachers and admins can view help requests" ON public.help_requests;
DROP POLICY IF EXISTS "Admins can update help requests" ON public.help_requests;
DROP POLICY IF EXISTS "Teachers can update help requests" ON public.help_requests;

-- INTERVENTION_FEEDBACK
DROP POLICY IF EXISTS "Admins can view feedback in their school" ON public.intervention_feedback;
DROP POLICY IF EXISTS "Teachers can view feedback for their implementations" ON public.intervention_feedback;

-- INTERVENTION_IMPLEMENTATIONS
DROP POLICY IF EXISTS "Admins can view implementations in their school" ON public.intervention_implementations;
DROP POLICY IF EXISTS "Teachers can view their own implementations" ON public.intervention_implementations;

-- MATH_BATTLE_PROGRESS
DROP POLICY IF EXISTS "Admins can view all math battle progress in their school" ON public.math_battle_progress;
DROP POLICY IF EXISTS "Students can view their own math battle progress" ON public.math_battle_progress;

-- OFFICE_HOURS_CONVERSATIONS
DROP POLICY IF EXISTS "Students can view their own conversations" ON public.office_hours_conversations;
DROP POLICY IF EXISTS "Teachers can view conversations with their students" ON public.office_hours_conversations;

-- OFFICE_HOURS_MESSAGES
DROP POLICY IF EXISTS "Admins can view messages in their school" ON public.office_hours_messages;
DROP POLICY IF EXISTS "Conversation participants can view messages" ON public.office_hours_messages;
DROP POLICY IF EXISTS "Students can send messages in their conversations" ON public.office_hours_messages;
DROP POLICY IF EXISTS "Teachers can send messages in their conversations" ON public.office_hours_messages;

-- PARENT_CHILD_RELATIONSHIPS
DROP POLICY IF EXISTS "Parents can view their own relationships" ON public.parent_child_relationships;
DROP POLICY IF EXISTS "Students can view their parent relationships" ON public.parent_child_relationships;

-- POLL_RESPONSES
DROP POLICY IF EXISTS "Admins and teachers can view responses for their school polls" ON public.poll_responses;
DROP POLICY IF EXISTS "Users can view their own responses" ON public.poll_responses;

-- POLLS
DROP POLICY IF EXISTS "Teachers can view polls for their school" ON public.polls;
DROP POLICY IF EXISTS "Users can view active polls targeted to them" ON public.polls;

-- SCHOOL_GEMINI_CONFIG
DROP POLICY IF EXISTS "Admins can manage their school's Gemini config" ON public.school_gemini_config;
DROP POLICY IF EXISTS "Service role can access all school Gemini configs" ON public.school_gemini_config;

-- SCHOOLS
DROP POLICY IF EXISTS "Admins can read their school" ON public.schools;
DROP POLICY IF EXISTS "Teachers can read their school" ON public.schools;

-- STUDENT_BADGE_ACHIEVEMENTS
DROP POLICY IF EXISTS "School community can view badge achievements" ON public.student_badge_achievements;
DROP POLICY IF EXISTS "Students can view their own badge achievements" ON public.student_badge_achievements;

-- STUDENT_MOODS
DROP POLICY IF EXISTS "Admins can view student moods in their school" ON public.student_moods;
DROP POLICY IF EXISTS "Teachers can view student moods in their school" ON public.student_moods;

-- STUDENT_QUEST_PROGRESS
DROP POLICY IF EXISTS "Students can view their own quest progress" ON public.student_quest_progress;
DROP POLICY IF EXISTS "Teachers can view quest progress in their school" ON public.student_quest_progress;

-- STUDENT_RECOGNITION_STATS
DROP POLICY IF EXISTS "Students can view their own recognition stats" ON public.student_recognition_stats;
DROP POLICY IF EXISTS "Teachers can view recognition stats in their school" ON public.student_recognition_stats;

-- SUBJECT_PROGRESS
DROP POLICY IF EXISTS "School staff can view student progress" ON public.subject_progress;
DROP POLICY IF EXISTS "Students can view own progress" ON public.subject_progress;

-- TEACHER_INTERVENTION_STATS
DROP POLICY IF EXISTS "Admins can view teacher stats in their school" ON public.teacher_intervention_stats;
DROP POLICY IF EXISTS "Teachers can view their own stats" ON public.teacher_intervention_stats;

-- TEACHER_OFFICE_HOURS
DROP POLICY IF EXISTS "Admins can manage office hours in their school" ON public.teacher_office_hours;
DROP POLICY IF EXISTS "Teachers can manage their own office hours" ON public.teacher_office_hours;

-- TEACHER_SETTINGS
DROP POLICY IF EXISTS "Admins can view teacher settings from their school" ON public.teacher_settings;
DROP POLICY IF EXISTS "Teachers can view own settings" ON public.teacher_settings;

-- WELLBEING_ASSESSMENTS
DROP POLICY IF EXISTS "Admins and teachers can view school assessments" ON public.wellbeing_assessments;
DROP POLICY IF EXISTS "Students can view their own assessments" ON public.wellbeing_assessments;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ All old duplicate policies dropped. Now run FIX_REMAINING_DUPLICATES.sql';
END $$;
