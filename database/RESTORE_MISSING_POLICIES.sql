-- RESTORE SELECT POLICIES THAT WERE DROPPED
-- Based on the actual existing policy patterns in your database

-- STUDENT_SHOUT_OUTS - Restore SELECT policies
CREATE POLICY "Admins can view all shout-outs in their school" ON public.student_shout_outs
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND school_id = student_shout_outs.school_id)
);

CREATE POLICY "Public shout-outs visible to school community" ON public.student_shout_outs
FOR SELECT USING (
    is_public = true AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = student_shout_outs.school_id)
);

CREATE POLICY "Students can view shout-outs about themselves" ON public.student_shout_outs
FOR SELECT USING (
    student_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'student')
);

CREATE POLICY "Teachers can view shout-outs in their school" ON public.student_shout_outs
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher' AND school_id = student_shout_outs.school_id)
);

-- ASSESSMENTS - Restore SELECT policies
CREATE POLICY "Admins can view school assessments" ON public.assessments
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin' AND school_id = assessments.school_id)
);

CREATE POLICY "Students can view published assessments" ON public.assessments
FOR SELECT USING (
    is_published = true AND class_id IN (SELECT class_id FROM public.student_class_assignments WHERE student_id = auth.uid() AND is_active = true)
);

CREATE POLICY "Teachers can view own assessments" ON public.assessments
FOR SELECT USING (
    teacher_id = auth.uid()
);

-- CUSTOM_QUESTS - Restore SELECT policies
CREATE POLICY "Admins can view all quests in their school" ON public.custom_quests
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND school_id = custom_quests.school_id)
);

CREATE POLICY "Students can view active quests in their school" ON public.custom_quests
FOR SELECT USING (
    is_active = true AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'student' AND school_id = custom_quests.school_id)
);

CREATE POLICY "Teachers can view their own quests" ON public.custom_quests
FOR SELECT USING (
    created_by = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
);

-- MANAGEMENT_MESSAGES - Restore SELECT policies
CREATE POLICY "Staff can read school messages" ON public.management_messages
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles staff_profile
            WHERE staff_profile.id = auth.uid() 
            AND staff_profile.role IN ('admin', 'teacher', 'principal')
            AND staff_profile.school_id = management_messages.school_id)
);

CREATE POLICY "Staff can read sent messages" ON public.management_messages
FOR SELECT USING (
    auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'principal'))
);

CREATE POLICY "Students can read own messages" ON public.management_messages
FOR SELECT USING (
    auth.uid() = recipient_id AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'student')
);

-- STUDENT_CLASS_ASSIGNMENTS - Restore SELECT policies
CREATE POLICY "Admins can view all student class assignments" ON public.student_class_assignments
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin') AND school_id = student_class_assignments.school_id)
);

CREATE POLICY "Students can view their own class assignments" ON public.student_class_assignments
FOR SELECT USING (
    student_id = auth.uid()
);

CREATE POLICY "Teachers can view class assignments for their classes" ON public.student_class_assignments
FOR SELECT USING (
    class_id IN (SELECT class_id FROM public.teacher_class_assignments WHERE teacher_id = auth.uid())
);

-- TEACHER_CLASS_ASSIGNMENTS - Restore SELECT policies
CREATE POLICY "Teachers can view their own assignments" ON public.teacher_class_assignments
FOR SELECT USING (
    teacher_id = auth.uid()
);

CREATE POLICY "Teachers can view their own class assignments" ON public.teacher_class_assignments
FOR SELECT USING (
    teacher_id = auth.uid()
);

CREATE POLICY "Users can view teacher assignments from their school" ON public.teacher_class_assignments
FOR SELECT USING (
    school_id IN (SELECT school_id FROM public.profiles WHERE user_id = auth.uid())
);

-- ASSESSMENT_ANALYTICS - Restore SELECT policies
CREATE POLICY "Admins can view school analytics" ON public.assessment_analytics
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin' AND school_id = assessment_analytics.school_id)
);

CREATE POLICY "Teachers can view own assessment analytics" ON public.assessment_analytics
FOR SELECT USING (
    assessment_id IN (SELECT id FROM public.assessments WHERE teacher_id = auth.uid())
);

-- ASSESSMENT_GRADES - Restore SELECT policies
CREATE POLICY "Assessment grades view access" ON public.assessment_grades
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = assessment_grades.school_id AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.assessments WHERE id = assessment_grades.assessment_id AND teacher_id = auth.uid())
    OR student_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.parent_child_relationships WHERE parent_id = auth.uid() AND child_id = assessment_grades.student_id)
);

CREATE POLICY "Students can view own grades" ON public.assessment_grades
FOR SELECT USING (
    student_id = auth.uid()
);

-- CUSTOM_BADGES - Restore SELECT policies
CREATE POLICY "School community can view active badges" ON public.custom_badges
FOR SELECT USING (
    is_active = true AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = custom_badges.school_id)
);

CREATE POLICY "Teachers can view their own badges" ON public.custom_badges
FOR SELECT USING (
    created_by = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
);

-- EXAMINATIONS - Restore SELECT policies
CREATE POLICY "Admins can view school exams" ON public.examinations
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin' AND school_id = examinations.school_id)
);

CREATE POLICY "Students can view published exams in their classes" ON public.examinations
FOR SELECT USING (
    is_published = true AND is_active = true 
    AND (class_id IS NULL OR class_id IN (SELECT class_id FROM public.student_class_assignments WHERE student_id = auth.uid() AND is_active = true))
);

-- GEM_TRANSACTIONS - Restore SELECT policies
CREATE POLICY "Students can view their transactions" ON public.gem_transactions
FOR SELECT USING (
    student_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'student')
);

CREATE POLICY "Teachers can view their own transactions" ON public.gem_transactions
FOR SELECT USING (
    teacher_id = auth.uid() OR student_id = auth.uid()
);

-- HELP_REQUESTS - Restore SELECT policies
CREATE POLICY "Students can view own help requests" ON public.help_requests
FOR SELECT USING (
    student_id = auth.uid()
);

CREATE POLICY "Teachers and admins can view help requests" ON public.help_requests
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = help_requests.school_id AND role IN ('admin', 'teacher'))
);

-- INTERVENTION_FEEDBACK - Restore SELECT policies
CREATE POLICY "Admins can view feedback in their school" ON public.intervention_feedback
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = intervention_feedback.school_id AND role = 'admin')
);

CREATE POLICY "Teachers can view feedback for their implementations" ON public.intervention_feedback
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.intervention_implementations WHERE id = intervention_feedback.implementation_id AND teacher_id = auth.uid())
);

-- INTERVENTION_IMPLEMENTATIONS - Restore SELECT policies
CREATE POLICY "Admins can view implementations in their school" ON public.intervention_implementations
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = intervention_implementations.school_id AND role = 'admin')
);

CREATE POLICY "Teachers can view their own implementations" ON public.intervention_implementations
FOR SELECT USING (
    teacher_id = auth.uid()
);

-- MATH_BATTLE_PROGRESS - Restore SELECT policies
CREATE POLICY "Admins can view all math battle progress in their school" ON public.math_battle_progress
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles admin_profile
            JOIN public.profiles student_profile ON student_profile.id = math_battle_progress.student_id
            WHERE admin_profile.id = auth.uid() 
            AND admin_profile.role = 'admin'
            AND admin_profile.school_id = student_profile.school_id)
);

CREATE POLICY "Students can view their own math battle progress" ON public.math_battle_progress
FOR SELECT USING (
    auth.uid() = student_id
);

-- OFFICE_HOURS_CONVERSATIONS - Restore SELECT policies
CREATE POLICY "Students can view their own conversations" ON public.office_hours_conversations
FOR SELECT USING (
    student_id = auth.uid()
);

CREATE POLICY "Teachers can view conversations with their students" ON public.office_hours_conversations
FOR SELECT USING (
    teacher_id = auth.uid()
);

-- OFFICE_HOURS_MESSAGES - Restore SELECT policies
CREATE POLICY "Admins can view messages in their school" ON public.office_hours_messages
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.office_hours_conversations WHERE id = office_hours_messages.conversation_id 
            AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND school_id = office_hours_conversations.school_id))
);

CREATE POLICY "Conversation participants can view messages" ON public.office_hours_messages
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.office_hours_conversations WHERE id = office_hours_messages.conversation_id 
            AND (student_id = auth.uid() OR teacher_id = auth.uid()))
);

-- PARENT_CHILD_RELATIONSHIPS - Restore SELECT policies
CREATE POLICY "Parents can view their own relationships" ON public.parent_child_relationships
FOR SELECT USING (
    parent_id = auth.uid()
);

CREATE POLICY "Students can view their parent relationships" ON public.parent_child_relationships
FOR SELECT USING (
    child_id = auth.uid()
);

-- POLL_RESPONSES - Restore SELECT policies
CREATE POLICY "Admins and teachers can view responses for their school polls" ON public.poll_responses
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.polls WHERE id = poll_responses.poll_id 
            AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = polls.school_id AND role IN ('admin', 'teacher')))
);

CREATE POLICY "Users can view their own responses" ON public.poll_responses
FOR SELECT USING (
    respondent_id = auth.uid()
);

-- POLLS - Restore SELECT policies
CREATE POLICY "Teachers can view polls for their school" ON public.polls
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.school_id = polls.school_id AND role IN ('admin', 'teacher'))
);

CREATE POLICY "Users can view active polls targeted to them" ON public.polls
FOR SELECT USING (
    status = 'active' AND 
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.school_id = polls.school_id 
            AND (target_audience = 'all' OR 
                 (target_audience = 'students' AND p.role = 'student') OR 
                 (target_audience = 'teachers' AND p.role = 'teacher') OR 
                 (target_audience = 'parents' AND p.role = 'parent')))
);

-- SCHOOLS - Restore SELECT policies
CREATE POLICY "Admins can read their school" ON public.schools
FOR SELECT USING (
    id IN (SELECT school_id FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Teachers can read their school" ON public.schools
FOR SELECT USING (
    id IN (SELECT school_id FROM public.profiles WHERE user_id = auth.uid())
);

-- STUDENT_BADGE_ACHIEVEMENTS - Restore SELECT policies
CREATE POLICY "School community can view badge achievements" ON public.student_badge_achievements
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = student_badge_achievements.school_id)
);

CREATE POLICY "Students can view their own badge achievements" ON public.student_badge_achievements
FOR SELECT USING (
    student_id = auth.uid()
);

-- STUDENT_MOODS - Restore SELECT policies
CREATE POLICY "Admins can view student moods in their school" ON public.student_moods
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = student_moods.school_id AND role = 'admin')
);

CREATE POLICY "Teachers can view student moods in their school" ON public.student_moods
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = student_moods.school_id AND role = 'teacher')
);

-- STUDENT_QUEST_PROGRESS - Restore SELECT policies
CREATE POLICY "Students can view their own quest progress" ON public.student_quest_progress
FOR SELECT USING (
    student_id = auth.uid()
);

CREATE POLICY "Teachers can view quest progress in their school" ON public.student_quest_progress
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = student_quest_progress.school_id AND role IN ('admin', 'teacher'))
);

-- STUDENT_RECOGNITION_STATS - Restore SELECT policies
CREATE POLICY "Students can view their own recognition stats" ON public.student_recognition_stats
FOR SELECT USING (
    student_id = auth.uid()
);

CREATE POLICY "Teachers can view recognition stats in their school" ON public.student_recognition_stats
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = student_recognition_stats.school_id AND role IN ('admin', 'teacher'))
);

-- SUBJECT_PROGRESS - Restore SELECT policies
CREATE POLICY "School staff can view student progress" ON public.subject_progress
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p1
            JOIN public.profiles p2 ON p1.school_id = p2.school_id
            WHERE p1.user_id = auth.uid() 
            AND p2.user_id = subject_progress.student_id
            AND p1.role IN ('admin', 'teacher'))
);

CREATE POLICY "Students can view own progress" ON public.subject_progress
FOR SELECT USING (
    student_id = auth.uid()
);

-- TEACHER_INTERVENTION_STATS - Restore SELECT policies
CREATE POLICY "Admins can view teacher stats in their school" ON public.teacher_intervention_stats
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = teacher_intervention_stats.school_id AND role = 'admin')
);

CREATE POLICY "Teachers can view their own stats" ON public.teacher_intervention_stats
FOR SELECT USING (
    teacher_id = auth.uid()
);

-- TEACHER_SETTINGS - Restore SELECT policies
CREATE POLICY "Admins can view teacher settings from their school" ON public.teacher_settings
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p1
            WHERE p1.user_id = auth.uid() 
            AND p1.role = 'admin'
            AND EXISTS (SELECT 1 FROM public.profiles p2
                        WHERE p2.user_id = teacher_settings.teacher_id
                        AND p2.school_id = p1.school_id))
);

CREATE POLICY "Teachers can view own settings" ON public.teacher_settings
FOR SELECT USING (
    teacher_id = auth.uid()
);

-- WELLBEING_ASSESSMENTS - Restore SELECT policies
CREATE POLICY "Admins and teachers can view school assessments" ON public.wellbeing_assessments
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = wellbeing_assessments.school_id AND role IN ('admin', 'teacher'))
);

CREATE POLICY "Students can view their own assessments" ON public.wellbeing_assessments
FOR SELECT USING (
    student_id = auth.uid()
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ All SELECT policies restored successfully!';
END $$;
