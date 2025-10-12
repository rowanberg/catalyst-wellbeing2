-- Optimize RLS Performance by wrapping auth.uid() in SELECT
-- This prevents re-evaluation of auth.uid() for each row
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- SCHOOLS
DROP POLICY IF EXISTS "Admins can read their school" ON public.schools;
CREATE POLICY "Admins can read their school" ON public.schools
FOR SELECT USING (
    id IN (SELECT school_id FROM public.profiles WHERE user_id = (SELECT auth.uid()) AND role = 'admin')
);

DROP POLICY IF EXISTS "Teachers can read their school" ON public.schools;
CREATE POLICY "Teachers can read their school" ON public.schools
FOR SELECT USING (
    id IN (SELECT school_id FROM public.profiles WHERE user_id = (SELECT auth.uid()))
);

-- HELP_REQUESTS
DROP POLICY IF EXISTS "Students can view own help requests" ON public.help_requests;
CREATE POLICY "Students can view own help requests" ON public.help_requests
FOR SELECT USING (
    student_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Teachers and admins can view help requests" ON public.help_requests;
CREATE POLICY "Teachers and admins can view help requests" ON public.help_requests
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = help_requests.school_id AND role IN ('admin', 'teacher'))
);

-- WELLBEING_ASSESSMENTS
DROP POLICY IF EXISTS "Admins and teachers can view school assessments" ON public.wellbeing_assessments;
CREATE POLICY "Admins and teachers can view school assessments" ON public.wellbeing_assessments
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = wellbeing_assessments.school_id AND role IN ('admin', 'teacher'))
);

DROP POLICY IF EXISTS "Students can view their own assessments" ON public.wellbeing_assessments;
CREATE POLICY "Students can view their own assessments" ON public.wellbeing_assessments
FOR SELECT USING (
    student_id = (SELECT auth.uid())
);

-- POLLS
DROP POLICY IF EXISTS "Teachers can view polls for their school" ON public.polls;
CREATE POLICY "Teachers can view polls for their school" ON public.polls
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.school_id = polls.school_id AND role IN ('admin', 'teacher'))
);

DROP POLICY IF EXISTS "Users can view active polls targeted to them" ON public.polls;
CREATE POLICY "Users can view active polls targeted to them" ON public.polls
FOR SELECT USING (
    status = 'active' AND 
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.school_id = polls.school_id 
            AND (target_audience = 'all' OR 
                 (target_audience = 'students' AND p.role = 'student') OR 
                 (target_audience = 'teachers' AND p.role = 'teacher') OR 
                 (target_audience = 'parents' AND p.role = 'parent')))
);

-- POLL_RESPONSES
DROP POLICY IF EXISTS "Admins and teachers can view responses for their school polls" ON public.poll_responses;
CREATE POLICY "Admins and teachers can view responses for their school polls" ON public.poll_responses
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.polls WHERE id = poll_responses.poll_id 
            AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = polls.school_id AND role IN ('admin', 'teacher')))
);

DROP POLICY IF EXISTS "Users can view their own responses" ON public.poll_responses;
CREATE POLICY "Users can view their own responses" ON public.poll_responses
FOR SELECT USING (
    respondent_id = (SELECT auth.uid())
);

-- OFFICE_HOURS_CONVERSATIONS
DROP POLICY IF EXISTS "Students can view their own conversations" ON public.office_hours_conversations;
CREATE POLICY "Students can view their own conversations" ON public.office_hours_conversations
FOR SELECT USING (
    student_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Teachers can view conversations with their students" ON public.office_hours_conversations;
CREATE POLICY "Teachers can view conversations with their students" ON public.office_hours_conversations
FOR SELECT USING (
    teacher_id = (SELECT auth.uid())
);

-- OFFICE_HOURS_MESSAGES
DROP POLICY IF EXISTS "Admins can view messages in their school" ON public.office_hours_messages;
CREATE POLICY "Admins can view messages in their school" ON public.office_hours_messages
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.office_hours_conversations WHERE id = office_hours_messages.conversation_id 
            AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin' AND school_id = office_hours_conversations.school_id))
);

DROP POLICY IF EXISTS "Conversation participants can view messages" ON public.office_hours_messages;
CREATE POLICY "Conversation participants can view messages" ON public.office_hours_messages
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.office_hours_conversations WHERE id = office_hours_messages.conversation_id 
            AND (student_id = (SELECT auth.uid()) OR teacher_id = (SELECT auth.uid())))
);

-- INTERVENTION_IMPLEMENTATIONS
DROP POLICY IF EXISTS "Admins can view implementations in their school" ON public.intervention_implementations;
CREATE POLICY "Admins can view implementations in their school" ON public.intervention_implementations
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = intervention_implementations.school_id AND role = 'admin')
);

DROP POLICY IF EXISTS "Teachers can view their own implementations" ON public.intervention_implementations;
CREATE POLICY "Teachers can view their own implementations" ON public.intervention_implementations
FOR SELECT USING (
    teacher_id = (SELECT auth.uid())
);

-- TEACHER_INTERVENTION_STATS
DROP POLICY IF EXISTS "Admins can view teacher stats in their school" ON public.teacher_intervention_stats;
CREATE POLICY "Admins can view teacher stats in their school" ON public.teacher_intervention_stats
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = teacher_intervention_stats.school_id AND role = 'admin')
);

DROP POLICY IF EXISTS "Teachers can view their own stats" ON public.teacher_intervention_stats;
CREATE POLICY "Teachers can view their own stats" ON public.teacher_intervention_stats
FOR SELECT USING (
    teacher_id = (SELECT auth.uid())
);

-- STUDENT_MOODS  
DROP POLICY IF EXISTS "Admins can view student moods in their school" ON public.student_moods;
CREATE POLICY "Admins can view student moods in their school" ON public.student_moods
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = student_moods.school_id AND role = 'admin')
);

DROP POLICY IF EXISTS "Teachers can view student moods in their school" ON public.student_moods;
CREATE POLICY "Teachers can view student moods in their school" ON public.student_moods
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = student_moods.school_id AND role = 'teacher')
);

-- INTERVENTION_FEEDBACK
DROP POLICY IF EXISTS "Admins can view feedback in their school" ON public.intervention_feedback;
CREATE POLICY "Admins can view feedback in their school" ON public.intervention_feedback
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = intervention_feedback.school_id AND role = 'admin')
);

DROP POLICY IF EXISTS "Teachers can view feedback for their implementations" ON public.intervention_feedback;
CREATE POLICY "Teachers can view feedback for their implementations" ON public.intervention_feedback
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.intervention_implementations WHERE id = intervention_feedback.implementation_id AND teacher_id = (SELECT auth.uid()))
);

-- Continue with remaining tables...
-- STUDENT_SHOUT_OUTS
DROP POLICY IF EXISTS "Admins can view all shout-outs in their school" ON public.student_shout_outs;
CREATE POLICY "Admins can view all shout-outs in their school" ON public.student_shout_outs
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin' AND school_id = student_shout_outs.school_id)
);

DROP POLICY IF EXISTS "Public shout-outs visible to school community" ON public.student_shout_outs;
CREATE POLICY "Public shout-outs visible to school community" ON public.student_shout_outs
FOR SELECT USING (
    is_public = true AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = student_shout_outs.school_id)
);

DROP POLICY IF EXISTS "Students can view shout-outs about themselves" ON public.student_shout_outs;
CREATE POLICY "Students can view shout-outs about themselves" ON public.student_shout_outs
FOR SELECT USING (
    student_id = (SELECT auth.uid()) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'student')
);

DROP POLICY IF EXISTS "Teachers can view shout-outs in their school" ON public.student_shout_outs;
CREATE POLICY "Teachers can view shout-outs in their school" ON public.student_shout_outs
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'teacher' AND school_id = student_shout_outs.school_id)
);

-- STUDENT_RECOGNITION_STATS
DROP POLICY IF EXISTS "Students can view their own recognition stats" ON public.student_recognition_stats;
CREATE POLICY "Students can view their own recognition stats" ON public.student_recognition_stats
FOR SELECT USING (
    student_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Teachers can view recognition stats in their school" ON public.student_recognition_stats;
CREATE POLICY "Teachers can view recognition stats in their school" ON public.student_recognition_stats
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = student_recognition_stats.school_id AND role IN ('admin', 'teacher'))
);

-- CUSTOM_QUESTS
DROP POLICY IF EXISTS "Admins can view all quests in their school" ON public.custom_quests;
CREATE POLICY "Admins can view all quests in their school" ON public.custom_quests
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin' AND school_id = custom_quests.school_id)
);

DROP POLICY IF EXISTS "Students can view active quests in their school" ON public.custom_quests;
CREATE POLICY "Students can view active quests in their school" ON public.custom_quests
FOR SELECT USING (
    is_active = true AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'student' AND school_id = custom_quests.school_id)
);

DROP POLICY IF EXISTS "Teachers can view their own quests" ON public.custom_quests;
CREATE POLICY "Teachers can view their own quests" ON public.custom_quests
FOR SELECT USING (
    created_by = (SELECT auth.uid()) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'teacher')
);

-- CUSTOM_BADGES
DROP POLICY IF EXISTS "School community can view active badges" ON public.custom_badges;
CREATE POLICY "School community can view active badges" ON public.custom_badges
FOR SELECT USING (
    is_active = true AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = custom_badges.school_id)
);

DROP POLICY IF EXISTS "Teachers can view their own badges" ON public.custom_badges;
CREATE POLICY "Teachers can view their own badges" ON public.custom_badges
FOR SELECT USING (
    created_by = (SELECT auth.uid()) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'teacher')
);

-- STUDENT_QUEST_PROGRESS
DROP POLICY IF EXISTS "Students can view their own quest progress" ON public.student_quest_progress;
CREATE POLICY "Students can view their own quest progress" ON public.student_quest_progress
FOR SELECT USING (
    student_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Teachers can view quest progress in their school" ON public.student_quest_progress;
CREATE POLICY "Teachers can view quest progress in their school" ON public.student_quest_progress
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = student_quest_progress.school_id AND role IN ('admin', 'teacher'))
);

-- STUDENT_BADGE_ACHIEVEMENTS
DROP POLICY IF EXISTS "School community can view badge achievements" ON public.student_badge_achievements;
CREATE POLICY "School community can view badge achievements" ON public.student_badge_achievements
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = student_badge_achievements.school_id)
);

DROP POLICY IF EXISTS "Students can view their own badge achievements" ON public.student_badge_achievements;
CREATE POLICY "Students can view their own badge achievements" ON public.student_badge_achievements
FOR SELECT USING (
    student_id = (SELECT auth.uid())
);

-- SUBJECT_PROGRESS
DROP POLICY IF EXISTS "School staff can view student progress" ON public.subject_progress;
CREATE POLICY "School staff can view student progress" ON public.subject_progress
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p1
            JOIN public.profiles p2 ON p1.school_id = p2.school_id
            WHERE p1.user_id = (SELECT auth.uid())
            AND p2.user_id = subject_progress.student_id
            AND p1.role IN ('admin', 'teacher'))
);

DROP POLICY IF EXISTS "Students can view own progress" ON public.subject_progress;
CREATE POLICY "Students can view own progress" ON public.subject_progress
FOR SELECT USING (
    student_id = (SELECT auth.uid())
);

-- TEACHER_CLASS_ASSIGNMENTS
DROP POLICY IF EXISTS "Teachers can view their own assignments" ON public.teacher_class_assignments;
CREATE POLICY "Teachers can view their own assignments" ON public.teacher_class_assignments
FOR SELECT USING (
    teacher_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Teachers can view their own class assignments" ON public.teacher_class_assignments;
CREATE POLICY "Teachers can view their own class assignments" ON public.teacher_class_assignments
FOR SELECT USING (
    teacher_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Users can view teacher assignments from their school" ON public.teacher_class_assignments;
CREATE POLICY "Users can view teacher assignments from their school" ON public.teacher_class_assignments
FOR SELECT USING (
    school_id IN (SELECT school_id FROM public.profiles WHERE user_id = (SELECT auth.uid()))
);

-- MATH_BATTLE_PROGRESS
DROP POLICY IF EXISTS "Admins can view all math battle progress in their school" ON public.math_battle_progress;
CREATE POLICY "Admins can view all math battle progress in their school" ON public.math_battle_progress
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles admin_profile
            JOIN public.profiles student_profile ON student_profile.id = math_battle_progress.student_id
            WHERE admin_profile.id = (SELECT auth.uid())
            AND admin_profile.role = 'admin'
            AND admin_profile.school_id = student_profile.school_id)
);

DROP POLICY IF EXISTS "Students can view their own math battle progress" ON public.math_battle_progress;
CREATE POLICY "Students can view their own math battle progress" ON public.math_battle_progress
FOR SELECT USING (
    (SELECT auth.uid()) = student_id
);

-- MANAGEMENT_MESSAGES
DROP POLICY IF EXISTS "Staff can read school messages" ON public.management_messages;
CREATE POLICY "Staff can read school messages" ON public.management_messages
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles staff_profile
            WHERE staff_profile.id = (SELECT auth.uid())
            AND staff_profile.role IN ('admin', 'teacher', 'principal')
            AND staff_profile.school_id = management_messages.school_id)
);

DROP POLICY IF EXISTS "Staff can read sent messages" ON public.management_messages;
CREATE POLICY "Staff can read sent messages" ON public.management_messages
FOR SELECT USING (
    (SELECT auth.uid()) = sender_id AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'teacher', 'principal'))
);

DROP POLICY IF EXISTS "Students can read own messages" ON public.management_messages;
CREATE POLICY "Students can read own messages" ON public.management_messages
FOR SELECT USING (
    (SELECT auth.uid()) = recipient_id AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'student')
);

-- ASSESSMENTS
DROP POLICY IF EXISTS "Admins can view school assessments" ON public.assessments;
CREATE POLICY "Admins can view school assessments" ON public.assessments
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = (SELECT auth.uid()) AND role = 'admin' AND school_id = assessments.school_id)
);

DROP POLICY IF EXISTS "Students can view published assessments" ON public.assessments;
CREATE POLICY "Students can view published assessments" ON public.assessments
FOR SELECT USING (
    is_published = true AND class_id IN (SELECT class_id FROM public.student_class_assignments WHERE student_id = (SELECT auth.uid()) AND is_active = true)
);

DROP POLICY IF EXISTS "Teachers can view own assessments" ON public.assessments;
CREATE POLICY "Teachers can view own assessments" ON public.assessments
FOR SELECT USING (
    teacher_id = (SELECT auth.uid())
);

-- ASSESSMENT_GRADES
DROP POLICY IF EXISTS "Assessment grades view access" ON public.assessment_grades;
CREATE POLICY "Assessment grades view access" ON public.assessment_grades
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = assessment_grades.school_id AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.assessments WHERE id = assessment_grades.assessment_id AND teacher_id = (SELECT auth.uid()))
    OR student_id = (SELECT auth.uid())
    OR EXISTS (SELECT 1 FROM public.parent_child_relationships WHERE parent_id = (SELECT auth.uid()) AND child_id = assessment_grades.student_id)
);

DROP POLICY IF EXISTS "Students can view own grades" ON public.assessment_grades;
CREATE POLICY "Students can view own grades" ON public.assessment_grades
FOR SELECT USING (
    student_id = (SELECT auth.uid())
);

-- PARENT_CHILD_RELATIONSHIPS
DROP POLICY IF EXISTS "Parents can view their own relationships" ON public.parent_child_relationships;
CREATE POLICY "Parents can view their own relationships" ON public.parent_child_relationships
FOR SELECT USING (
    parent_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Students can view their parent relationships" ON public.parent_child_relationships;
CREATE POLICY "Students can view their parent relationships" ON public.parent_child_relationships
FOR SELECT USING (
    child_id = (SELECT auth.uid())
);

-- ASSESSMENT_ANALYTICS
DROP POLICY IF EXISTS "Admins can view school analytics" ON public.assessment_analytics;
CREATE POLICY "Admins can view school analytics" ON public.assessment_analytics
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = (SELECT auth.uid()) AND role = 'admin' AND school_id = assessment_analytics.school_id)
);

DROP POLICY IF EXISTS "Teachers can view own assessment analytics" ON public.assessment_analytics;
CREATE POLICY "Teachers can view own assessment analytics" ON public.assessment_analytics
FOR SELECT USING (
    assessment_id IN (SELECT id FROM public.assessments WHERE teacher_id = (SELECT auth.uid()))
);

-- GEM_TRANSACTIONS
DROP POLICY IF EXISTS "Students can view their transactions" ON public.gem_transactions;
CREATE POLICY "Students can view their transactions" ON public.gem_transactions
FOR SELECT USING (
    student_id = (SELECT auth.uid()) AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = (SELECT auth.uid()) AND role = 'student')
);

DROP POLICY IF EXISTS "Teachers can view their own transactions" ON public.gem_transactions;
CREATE POLICY "Teachers can view their own transactions" ON public.gem_transactions
FOR SELECT USING (
    teacher_id = (SELECT auth.uid()) OR student_id = (SELECT auth.uid())
);

-- EXAMINATIONS
DROP POLICY IF EXISTS "Admins can view school exams" ON public.examinations;
CREATE POLICY "Admins can view school exams" ON public.examinations
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = (SELECT auth.uid()) AND role = 'admin' AND school_id = examinations.school_id)
);

DROP POLICY IF EXISTS "Students can view published exams in their classes" ON public.examinations;
CREATE POLICY "Students can view published exams in their classes" ON public.examinations
FOR SELECT USING (
    is_published = true AND is_active = true 
    AND (class_id IS NULL OR class_id IN (SELECT class_id FROM public.student_class_assignments WHERE student_id = (SELECT auth.uid()) AND is_active = true))
);

-- TEACHER_SETTINGS
DROP POLICY IF EXISTS "Admins can view teacher settings from their school" ON public.teacher_settings;
CREATE POLICY "Admins can view teacher settings from their school" ON public.teacher_settings
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p1
            WHERE p1.user_id = (SELECT auth.uid())
            AND p1.role = 'admin'
            AND EXISTS (SELECT 1 FROM public.profiles p2
                        WHERE p2.user_id = teacher_settings.teacher_id
                        AND p2.school_id = p1.school_id))
);

DROP POLICY IF EXISTS "Teachers can view own settings" ON public.teacher_settings;
CREATE POLICY "Teachers can view own settings" ON public.teacher_settings
FOR SELECT USING (
    teacher_id = (SELECT auth.uid())
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ RLS performance optimizations applied - auth.uid() wrapped in SELECT for all policies';
    RAISE NOTICE 'This resolves 60+ auth_rls_initplan warnings';
END $$;
