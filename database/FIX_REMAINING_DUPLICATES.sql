-- =====================================================
-- FIX ALL REMAINING DUPLICATE POLICIES
-- =====================================================
-- This script consolidates all remaining duplicate policies

-- STUDENT_SHOUT_OUTS (4 policies)
DROP POLICY IF EXISTS "Admins can view all shout-outs in their school" ON public.student_shout_outs;
DROP POLICY IF EXISTS "Public shout-outs visible to school community" ON public.student_shout_outs;
DROP POLICY IF EXISTS "Students can view shout-outs about themselves" ON public.student_shout_outs;
DROP POLICY IF EXISTS "Teachers can view shout-outs in their school" ON public.student_shout_outs;

CREATE POLICY "student_shout_outs_select" ON public.student_shout_outs
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = student_shout_outs.school_id)
    AND (
        student_id = auth.uid() OR
        is_public = true OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
    )
);

-- ASSESSMENTS (3 policies)
DROP POLICY IF EXISTS "Admins can view school assessments" ON public.assessments;
DROP POLICY IF EXISTS "Students can view published assessments" ON public.assessments;
DROP POLICY IF EXISTS "Teachers can view own assessments" ON public.assessments;

CREATE POLICY "assessments_select" ON public.assessments
FOR SELECT USING (
    teacher_id = auth.uid() OR
    (is_published = true AND EXISTS (SELECT 1 FROM public.student_class_assignments WHERE student_id = auth.uid() AND class_id = assessments.class_id)) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = assessments.school_id AND role = 'admin')
);

-- CUSTOM_QUESTS (3 policies)
DROP POLICY IF EXISTS "Admins can view all quests in their school" ON public.custom_quests;
DROP POLICY IF EXISTS "Students can view active quests in their school" ON public.custom_quests;
DROP POLICY IF EXISTS "Teachers can view their own quests" ON public.custom_quests;

CREATE POLICY "custom_quests_select" ON public.custom_quests
FOR SELECT USING (
    created_by = auth.uid() OR
    (is_active = true AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = custom_quests.school_id AND role = 'student')) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = custom_quests.school_id AND role = 'admin')
);

-- MANAGEMENT_MESSAGES (3 policies)
DROP POLICY IF EXISTS "Staff can read school messages" ON public.management_messages;
DROP POLICY IF EXISTS "Staff can read sent messages" ON public.management_messages;
DROP POLICY IF EXISTS "Students can read own messages" ON public.management_messages;

CREATE POLICY "management_messages_select" ON public.management_messages
FOR SELECT USING (
    sender_id = auth.uid() OR
    recipient_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = management_messages.school_id AND role IN ('admin', 'teacher', 'principal'))
);

-- STUDENT_CLASS_ASSIGNMENTS (3 policies)
DROP POLICY IF EXISTS "Admins can view all student class assignments" ON public.student_class_assignments;
DROP POLICY IF EXISTS "Students can view their own class assignments" ON public.student_class_assignments;
DROP POLICY IF EXISTS "Teachers can view class assignments for their classes" ON public.student_class_assignments;

CREATE POLICY "student_class_assignments_select" ON public.student_class_assignments
FOR SELECT USING (
    student_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.teacher_class_assignments WHERE teacher_id = auth.uid() AND class_id = student_class_assignments.class_id) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = student_class_assignments.school_id AND role = 'admin')
);

-- TEACHER_CLASS_ASSIGNMENTS (3 policies - includes "Users can view")
DROP POLICY IF EXISTS "Teachers can view their own assignments" ON public.teacher_class_assignments;
DROP POLICY IF EXISTS "Teachers can view their own class assignments" ON public.teacher_class_assignments;
DROP POLICY IF EXISTS "Users can view teacher assignments from their school" ON public.teacher_class_assignments;

CREATE POLICY "teacher_class_assignments_select" ON public.teacher_class_assignments
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = teacher_class_assignments.school_id)
);

-- ASSESSMENT_ANALYTICS (2 policies)
DROP POLICY IF EXISTS "Admins can view school analytics" ON public.assessment_analytics;
DROP POLICY IF EXISTS "Teachers can view own assessment analytics" ON public.assessment_analytics;

CREATE POLICY "assessment_analytics_select" ON public.assessment_analytics
FOR SELECT USING (
    assessment_id IN (SELECT id FROM public.assessments WHERE teacher_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = assessment_analytics.school_id AND role = 'admin')
);

-- ASSESSMENT_GRADES (2 policies)
DROP POLICY IF EXISTS "Assessment grades view access" ON public.assessment_grades;
DROP POLICY IF EXISTS "Students can view own grades" ON public.assessment_grades;

CREATE POLICY "assessment_grades_select" ON public.assessment_grades
FOR SELECT USING (
    student_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.assessments a WHERE a.id = assessment_grades.assessment_id AND a.teacher_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = assessment_grades.school_id AND role = 'admin')
);

-- CUSTOM_BADGES (2 policies)
DROP POLICY IF EXISTS "School community can view active badges" ON public.custom_badges;
DROP POLICY IF EXISTS "Teachers can view their own badges" ON public.custom_badges;

CREATE POLICY "custom_badges_select" ON public.custom_badges
FOR SELECT USING (
    created_by = auth.uid() OR
    (is_active = true AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = custom_badges.school_id))
);

-- EXAMINATIONS (2 policies - missing teacher policy)
DROP POLICY IF EXISTS "Admins can view school exams" ON public.examinations;
DROP POLICY IF EXISTS "Students can view published exams in their classes" ON public.examinations;

CREATE POLICY "examinations_select" ON public.examinations
FOR SELECT USING (
    teacher_id = auth.uid() OR
    (is_published = true AND EXISTS (SELECT 1 FROM public.student_class_assignments WHERE student_id = auth.uid() AND class_id = examinations.class_id)) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = examinations.school_id AND role = 'admin')
);

-- GEM_TRANSACTIONS (2 policies)
DROP POLICY IF EXISTS "Students can view their transactions" ON public.gem_transactions;
DROP POLICY IF EXISTS "Teachers can view their own transactions" ON public.gem_transactions;

CREATE POLICY "gem_transactions_select" ON public.gem_transactions
FOR SELECT USING (
    student_id = auth.uid() OR
    teacher_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- HELP_REQUESTS
DROP POLICY IF EXISTS "Students can view own help requests" ON public.help_requests;
DROP POLICY IF EXISTS "Teachers and admins can view help requests" ON public.help_requests;

CREATE POLICY "help_requests_select" ON public.help_requests
FOR SELECT USING (
    student_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = help_requests.school_id AND role IN ('admin', 'teacher'))
);

DROP POLICY IF EXISTS "Admins can update help requests" ON public.help_requests;
DROP POLICY IF EXISTS "Teachers can update help requests" ON public.help_requests;

CREATE POLICY "help_requests_update" ON public.help_requests
FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = help_requests.school_id AND role IN ('admin', 'teacher'))
);

-- INTERVENTION_FEEDBACK (2 policies)
DROP POLICY IF EXISTS "Admins can view feedback in their school" ON public.intervention_feedback;
DROP POLICY IF EXISTS "Teachers can view feedback for their implementations" ON public.intervention_feedback;

CREATE POLICY "intervention_feedback_select" ON public.intervention_feedback
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.intervention_implementations WHERE id = intervention_feedback.implementation_id AND teacher_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = intervention_feedback.school_id AND role = 'admin')
);

-- INTERVENTION_IMPLEMENTATIONS (2 policies)
DROP POLICY IF EXISTS "Admins can view implementations in their school" ON public.intervention_implementations;
DROP POLICY IF EXISTS "Teachers can view their own implementations" ON public.intervention_implementations;

CREATE POLICY "intervention_implementations_select" ON public.intervention_implementations
FOR SELECT USING (
    teacher_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = intervention_implementations.school_id AND role = 'admin')
);

-- MATH_BATTLE_PROGRESS (2 policies)
DROP POLICY IF EXISTS "Admins can view all math battle progress in their school" ON public.math_battle_progress;
DROP POLICY IF EXISTS "Students can view their own math battle progress" ON public.math_battle_progress;

CREATE POLICY "math_battle_progress_select" ON public.math_battle_progress
FOR SELECT USING (
    student_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles admin_profile
            JOIN public.profiles student_profile ON student_profile.id = math_battle_progress.student_id
            WHERE admin_profile.id = auth.uid() 
            AND admin_profile.role = 'admin'
            AND admin_profile.school_id = student_profile.school_id)
);

-- OFFICE_HOURS_CONVERSATIONS
DROP POLICY IF EXISTS "Students can view their own conversations" ON public.office_hours_conversations;
DROP POLICY IF EXISTS "Teachers can view conversations with their students" ON public.office_hours_conversations;

CREATE POLICY "office_hours_conversations_select" ON public.office_hours_conversations
FOR SELECT USING (
    student_id = auth.uid() OR
    teacher_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = office_hours_conversations.school_id AND role = 'admin')
);

-- OFFICE_HOURS_MESSAGES
DROP POLICY IF EXISTS "Admins can view messages in their school" ON public.office_hours_messages;
DROP POLICY IF EXISTS "Conversation participants can view messages" ON public.office_hours_messages;

CREATE POLICY "office_hours_messages_select" ON public.office_hours_messages
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.office_hours_conversations c WHERE c.id = office_hours_messages.conversation_id 
            AND (c.student_id = auth.uid() OR c.teacher_id = auth.uid() OR 
                 EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = c.school_id AND role = 'admin')))
);

DROP POLICY IF EXISTS "Students can send messages in their conversations" ON public.office_hours_messages;
DROP POLICY IF EXISTS "Teachers can send messages in their conversations" ON public.office_hours_messages;

CREATE POLICY "office_hours_messages_insert" ON public.office_hours_messages
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.office_hours_conversations WHERE id = office_hours_messages.conversation_id 
            AND (student_id = auth.uid() OR teacher_id = auth.uid()))
);

-- PARENT_CHILD_RELATIONSHIPS (2 policies)
DROP POLICY IF EXISTS "Parents can view their own relationships" ON public.parent_child_relationships;
DROP POLICY IF EXISTS "Students can view their parent relationships" ON public.parent_child_relationships;

CREATE POLICY "parent_child_relationships_select" ON public.parent_child_relationships
FOR SELECT USING (
    parent_id = auth.uid() OR child_id = auth.uid()
);

-- POLL_RESPONSES (2 policies)
DROP POLICY IF EXISTS "Admins and teachers can view responses for their school polls" ON public.poll_responses;
DROP POLICY IF EXISTS "Users can view their own responses" ON public.poll_responses;

CREATE POLICY "poll_responses_select" ON public.poll_responses
FOR SELECT USING (
    respondent_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.polls WHERE id = poll_responses.poll_id 
            AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = polls.school_id AND role IN ('admin', 'teacher')))
);

-- POLLS (2 policies)
DROP POLICY IF EXISTS "Teachers can view polls for their school" ON public.polls;
DROP POLICY IF EXISTS "Users can view active polls targeted to them" ON public.polls;

CREATE POLICY "polls_select" ON public.polls
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.school_id = polls.school_id AND role IN ('admin', 'teacher')) OR
    (status = 'active' AND target_audience = 'all') OR
    (status = 'active' AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.school_id = polls.school_id 
             AND ((target_audience = 'students' AND p.role = 'student') OR 
                  (target_audience = 'teachers' AND p.role = 'teacher') OR 
                  (target_audience = 'parents' AND p.role = 'parent'))))
);

-- SCHOOL_GEMINI_CONFIG (2 policies for ALL)
DROP POLICY IF EXISTS "Admins can manage their school's Gemini config" ON public.school_gemini_config;
DROP POLICY IF EXISTS "Service role can access all school Gemini configs" ON public.school_gemini_config;

CREATE POLICY "school_gemini_config_all" ON public.school_gemini_config
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = school_gemini_config.school_id AND role = 'admin')
);

-- SCHOOLS (2 policies)
DROP POLICY IF EXISTS "Admins can read their school" ON public.schools;
DROP POLICY IF EXISTS "Teachers can read their school" ON public.schools;

CREATE POLICY "schools_select" ON public.schools
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = schools.id)
);

-- STUDENT_BADGE_ACHIEVEMENTS (2 policies)
DROP POLICY IF EXISTS "School community can view badge achievements" ON public.student_badge_achievements;
DROP POLICY IF EXISTS "Students can view their own badge achievements" ON public.student_badge_achievements;

CREATE POLICY "student_badge_achievements_select" ON public.student_badge_achievements
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = student_badge_achievements.school_id)
);

-- STUDENT_MOODS (2 policies)
DROP POLICY IF EXISTS "Admins can view student moods in their school" ON public.student_moods;
DROP POLICY IF EXISTS "Teachers can view student moods in their school" ON public.student_moods;

CREATE POLICY "student_moods_select" ON public.student_moods
FOR SELECT USING (
    student_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = student_moods.school_id AND role IN ('admin', 'teacher'))
);

-- STUDENT_QUEST_PROGRESS (2 policies)
DROP POLICY IF EXISTS "Students can view their own quest progress" ON public.student_quest_progress;
DROP POLICY IF EXISTS "Teachers can view quest progress in their school" ON public.student_quest_progress;

CREATE POLICY "student_quest_progress_select" ON public.student_quest_progress
FOR SELECT USING (
    student_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = student_quest_progress.school_id AND role IN ('admin', 'teacher'))
);

-- STUDENT_RECOGNITION_STATS (2 policies)
DROP POLICY IF EXISTS "Students can view their own recognition stats" ON public.student_recognition_stats;
DROP POLICY IF EXISTS "Teachers can view recognition stats in their school" ON public.student_recognition_stats;

CREATE POLICY "student_recognition_stats_select" ON public.student_recognition_stats
FOR SELECT USING (
    student_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = student_recognition_stats.school_id AND role IN ('admin', 'teacher'))
);

-- SUBJECT_PROGRESS (2 policies)
DROP POLICY IF EXISTS "School staff can view student progress" ON public.subject_progress;
DROP POLICY IF EXISTS "Students can view own progress" ON public.subject_progress;

CREATE POLICY "subject_progress_select" ON public.subject_progress
FOR SELECT USING (
    student_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles p1
            JOIN public.profiles p2 ON p1.school_id = p2.school_id
            WHERE p1.user_id = auth.uid() 
            AND p2.user_id = subject_progress.student_id
            AND p1.role IN ('admin', 'teacher'))
);

-- TEACHER_INTERVENTION_STATS (2 policies)
DROP POLICY IF EXISTS "Admins can view teacher stats in their school" ON public.teacher_intervention_stats;
DROP POLICY IF EXISTS "Teachers can view their own stats" ON public.teacher_intervention_stats;

CREATE POLICY "teacher_intervention_stats_select" ON public.teacher_intervention_stats
FOR SELECT USING (
    teacher_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = teacher_intervention_stats.school_id AND role = 'admin')
);

-- TEACHER_OFFICE_HOURS (2 policies for ALL)
DROP POLICY IF EXISTS "Admins can manage office hours in their school" ON public.teacher_office_hours;
DROP POLICY IF EXISTS "Teachers can manage their own office hours" ON public.teacher_office_hours;

CREATE POLICY "teacher_office_hours_all" ON public.teacher_office_hours
FOR ALL USING (
    teacher_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = teacher_office_hours.school_id AND role = 'admin')
);

-- TEACHER_SETTINGS (2 policies)
DROP POLICY IF EXISTS "Admins can view teacher settings from their school" ON public.teacher_settings;
DROP POLICY IF EXISTS "Teachers can view own settings" ON public.teacher_settings;

CREATE POLICY "teacher_settings_select" ON public.teacher_settings
FOR SELECT USING (
    teacher_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles p1
            WHERE p1.user_id = auth.uid() 
            AND p1.role = 'admin'
            AND EXISTS (SELECT 1 FROM public.profiles p2
                        WHERE p2.user_id = teacher_settings.teacher_id
                        AND p2.school_id = p1.school_id))
);

-- WELLBEING_ASSESSMENTS (2 policies)
DROP POLICY IF EXISTS "Admins and teachers can view school assessments" ON public.wellbeing_assessments;
DROP POLICY IF EXISTS "Students can view their own assessments" ON public.wellbeing_assessments;

CREATE POLICY "wellbeing_assessments_select" ON public.wellbeing_assessments
FOR SELECT USING (
    student_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = wellbeing_assessments.school_id AND role IN ('admin', 'teacher'))
);

-- Final Verification
DO $$
DECLARE
    duplicate_count INTEGER;
    remaining_tables TEXT;
BEGIN
    SELECT COUNT(*), string_agg(DISTINCT tablename || ' (' || cmd || ')', ', ')
    INTO duplicate_count, remaining_tables
    FROM (
        SELECT tablename, cmd, COUNT(*) as policy_count
        FROM pg_policies
        WHERE schemaname = 'public'
        GROUP BY tablename, cmd, roles
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count = 0 THEN
        RAISE NOTICE '✅ SUCCESS: All duplicate policies eliminated!';
    ELSE
        RAISE WARNING '⚠️ Still %% duplicates remaining on: %%', duplicate_count, remaining_tables;
    END IF;
END $$;
