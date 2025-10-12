-- =====================================================
-- CONSOLIDATE DUPLICATE RLS POLICIES - PART 2
-- =====================================================
-- Continues consolidating remaining duplicate policies

-- ASSESSMENT_GRADES: Remove old duplicate policy (we already created consolidated one)
DROP POLICY IF EXISTS "Students can view own grades" ON public.assessment_grades;

-- ACADEMIC_ASSESSMENTS: Consolidate 3 policies
CREATE POLICY "Academic assessments view access" ON public.academic_assessments
FOR SELECT USING (
    -- School staff (admins/teachers) can view
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = academic_assessments.school_id AND role IN ('admin', 'teacher'))
    OR
    -- Students can view own assessments
    student_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "School staff can view assessments" ON public.academic_assessments;
DROP POLICY IF EXISTS "Students can view own assessments" ON public.academic_assessments;
DROP POLICY IF EXISTS "Teachers can manage assessments" ON public.academic_assessments;

-- ANALYTICS_EVENTS: Consolidate admin and user policies
CREATE POLICY "Analytics events access" ON public.analytics_events
FOR SELECT USING (
    -- Admins can view all school events
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = analytics_events.school_id AND role = 'admin')
    OR
    -- Users can view their own events
    user_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Admins can view all school analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can view their own analytics events" ON public.analytics_events;

-- ASSESSMENT_ANALYTICS: Consolidate
CREATE POLICY "Assessment analytics access" ON public.assessment_analytics
FOR SELECT USING (
    -- Admins can view school analytics
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = assessment_analytics.school_id AND role = 'admin')
    OR
    -- Teachers can view own assessment analytics
    teacher_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Admins can view school analytics" ON public.assessment_analytics;
DROP POLICY IF EXISTS "Teachers can view own assessment analytics" ON public.assessment_analytics;

-- ASSESSMENTS: Consolidate
CREATE POLICY "Assessments view access" ON public.assessments
FOR SELECT USING (
    -- Admins can view school assessments
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = assessments.school_id AND role = 'admin')
    OR
    -- Teachers can view own assessments
    teacher_id = (SELECT auth.uid())
    OR
    -- Students can view published assessments
    (status = 'published' AND EXISTS (SELECT 1 FROM public.student_class_assignments WHERE student_id = (SELECT auth.uid()) AND class_id = assessments.class_id))
);

DROP POLICY IF EXISTS "Admins can view school assessments" ON public.assessments;
DROP POLICY IF EXISTS "Students can view published assessments" ON public.assessments;
DROP POLICY IF EXISTS "Teachers can view own assessments" ON public.assessments;

-- CLASSES: Consolidate
CREATE POLICY "Classes view access" ON public.classes
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = classes.school_id)
);

DROP POLICY IF EXISTS "Admins can manage classes in their school" ON public.classes;
DROP POLICY IF EXISTS "Users can view classes from their school" ON public.classes;

-- CUSTOM_BADGES: Consolidate
CREATE POLICY "Custom badges view access" ON public.custom_badges
FOR SELECT USING (
    -- Active badges visible to school community
    (is_active = true AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = custom_badges.school_id))
    OR
    -- Teachers can view their own badges
    created_by = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "School community can view active badges" ON public.custom_badges;
DROP POLICY IF EXISTS "Teachers can view their own badges" ON public.custom_badges;

-- CUSTOM_QUESTS: Consolidate
CREATE POLICY "Custom quests view access" ON public.custom_quests
FOR SELECT USING (
    -- Admins can view all quests in their school
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = custom_quests.school_id AND role = 'admin')
    OR
    -- Students can view active quests in their school
    (is_active = true AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = custom_quests.school_id AND role = 'student'))
    OR
    -- Teachers can view their own quests
    created_by = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Admins can view all quests in their school" ON public.custom_quests;
DROP POLICY IF EXISTS "Students can view active quests in their school" ON public.custom_quests;
DROP POLICY IF EXISTS "Teachers can view their own quests" ON public.custom_quests;

-- EXAM_QUESTIONS: Consolidate
CREATE POLICY "Exam questions view access" ON public.exam_questions
FOR SELECT USING (
    -- Teachers can manage questions for their exams
    EXISTS (SELECT 1 FROM public.examinations WHERE id = exam_questions.exam_id AND teacher_id = (SELECT auth.uid()))
    OR
    -- Students can view questions during active sessions
    EXISTS (SELECT 1 FROM public.student_exam_sessions ses
            JOIN public.examinations e ON ses.exam_id = e.id
            WHERE e.id = exam_questions.exam_id 
            AND ses.student_id = (SELECT auth.uid())
            AND ses.status = 'in_progress')
);

DROP POLICY IF EXISTS "Students can view questions during active sessions" ON public.exam_questions;
DROP POLICY IF EXISTS "Teachers can manage questions for their exams" ON public.exam_questions;

-- EXAMINATIONS: Consolidate
CREATE POLICY "Examinations view access" ON public.examinations
FOR SELECT USING (
    -- Admins can view school exams
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = examinations.school_id AND role = 'admin')
    OR
    -- Teachers can manage their own exams
    teacher_id = (SELECT auth.uid())
    OR
    -- Students can view published exams in their classes
    (status = 'published' AND EXISTS (SELECT 1 FROM public.student_class_assignments WHERE student_id = (SELECT auth.uid()) AND class_id = examinations.class_id))
);

DROP POLICY IF EXISTS "Admins can view school exams" ON public.examinations;
DROP POLICY IF EXISTS "Students can view published exams in their classes" ON public.examinations;
DROP POLICY IF EXISTS "Teachers can manage their own exams" ON public.examinations;

-- GEM_TRANSACTIONS: Consolidate
CREATE POLICY "Gem transactions view access" ON public.gem_transactions
FOR SELECT USING (
    -- Admins can manage all transactions
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = gem_transactions.school_id AND role = 'admin')
    OR
    -- Students can view their transactions
    student_id = (SELECT auth.uid())
    OR
    -- Teachers can view their own transactions (if they have any)
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND id = gem_transactions.student_id)
);

CREATE POLICY "Gem transactions insert access" ON public.gem_transactions
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = gem_transactions.school_id AND role IN ('admin', 'teacher'))
);

DROP POLICY IF EXISTS "Admins can manage all transactions" ON public.gem_transactions;
DROP POLICY IF EXISTS "Students can view their transactions" ON public.gem_transactions;
DROP POLICY IF EXISTS "Teachers can view their own transactions" ON public.gem_transactions;
DROP POLICY IF EXISTS "Teachers can insert transactions" ON public.gem_transactions;

-- GRADE_LEVELS: Consolidate
CREATE POLICY "Grade levels view access" ON public.grade_levels
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = grade_levels.school_id)
);

DROP POLICY IF EXISTS "Admins can manage grade levels in their school" ON public.grade_levels;
DROP POLICY IF EXISTS "Users can view grade levels from their school" ON public.grade_levels;

-- GRADING_RUBRICS: Consolidate
CREATE POLICY "Grading rubrics view access" ON public.grading_rubrics
FOR SELECT USING (
    -- Teachers can view own rubrics
    created_by = (SELECT auth.uid())
    OR
    -- Teachers can view shared rubrics
    (is_shared = true AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = grading_rubrics.school_id))
);

DROP POLICY IF EXISTS "Teachers can manage own rubrics" ON public.grading_rubrics;
DROP POLICY IF EXISTS "Teachers can view shared rubrics" ON public.grading_rubrics;

-- HELP_REQUESTS: Consolidate remaining policies
CREATE POLICY "Help requests view access" ON public.help_requests
FOR SELECT USING (
    -- Students can view own help requests
    student_id = (SELECT auth.uid())
    OR
    -- Teachers and admins can view help requests
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = help_requests.school_id AND role IN ('teacher', 'admin'))
);

CREATE POLICY "Help requests update access" ON public.help_requests
FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = help_requests.school_id AND role IN ('teacher', 'admin'))
);

DROP POLICY IF EXISTS "Students can view own help requests" ON public.help_requests;
DROP POLICY IF EXISTS "Teachers and admins can view help requests" ON public.help_requests;
DROP POLICY IF EXISTS "Admins can update help requests" ON public.help_requests;
DROP POLICY IF EXISTS "Teachers can update help requests" ON public.help_requests;

-- INCIDENT_REPORTS: Consolidate
CREATE POLICY "Incident reports view access" ON public.incident_reports
FOR SELECT USING (
    -- Admins and teachers can manage
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = incident_reports.school_id AND role IN ('admin', 'teacher'))
    OR
    -- Users can view reports they created or are involved in
    reporter_id = (SELECT auth.uid()) OR student_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Admins and teachers can manage incident reports" ON public.incident_reports;
DROP POLICY IF EXISTS "Users can view reports they created or are involved in" ON public.incident_reports;

-- INTERVENTION_FEEDBACK: Consolidate
CREATE POLICY "Intervention feedback view access" ON public.intervention_feedback
FOR SELECT USING (
    -- Admins can view feedback in their school
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = intervention_feedback.school_id AND role = 'admin')
    OR
    -- Teachers can view feedback for their implementations
    EXISTS (SELECT 1 FROM public.intervention_implementations WHERE id = intervention_feedback.implementation_id AND teacher_id = (SELECT auth.uid()))
);

DROP POLICY IF EXISTS "Admins can view feedback in their school" ON public.intervention_feedback;
DROP POLICY IF EXISTS "Teachers can view feedback for their implementations" ON public.intervention_feedback;

-- INTERVENTION_IMPLEMENTATIONS: Consolidate
CREATE POLICY "Intervention implementations view access" ON public.intervention_implementations
FOR SELECT USING (
    -- Admins can view implementations in their school
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = intervention_implementations.school_id AND role = 'admin')
    OR
    -- Teachers can view their own implementations
    teacher_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Admins can view implementations in their school" ON public.intervention_implementations;
DROP POLICY IF EXISTS "Teachers can view their own implementations" ON public.intervention_implementations;

-- MANAGEMENT_MESSAGES: Consolidate
CREATE POLICY "Management messages view access" ON public.management_messages
FOR SELECT USING (
    -- Staff can read school messages
    (recipient_type = 'staff' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = management_messages.school_id AND role IN ('admin', 'teacher')))
    OR
    -- Staff can read sent messages
    sender_id = (SELECT auth.uid())
    OR
    -- Students can read own messages
    (recipient_id = (SELECT auth.uid()))
);

DROP POLICY IF EXISTS "Staff can read school messages" ON public.management_messages;
DROP POLICY IF EXISTS "Staff can read sent messages" ON public.management_messages;
DROP POLICY IF EXISTS "Students can read own messages" ON public.management_messages;

-- MATH_BATTLE_PROGRESS: Consolidate
CREATE POLICY "Math battle progress view access" ON public.math_battle_progress
FOR SELECT USING (
    -- Admins can view all in their school
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = math_battle_progress.school_id AND role = 'admin')
    OR
    -- Students can view their own progress
    student_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Admins can view all math battle progress in their school" ON public.math_battle_progress;
DROP POLICY IF EXISTS "Students can view their own math battle progress" ON public.math_battle_progress;

-- OFFICE_HOURS_CONVERSATIONS: Consolidate
CREATE POLICY "Office hours conversations insert access" ON public.office_hours_conversations
FOR INSERT WITH CHECK (
    -- Students can create conversations with teachers from their school
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = office_hours_conversations.school_id)
);

CREATE POLICY "Office hours conversations view access" ON public.office_hours_conversations
FOR SELECT USING (
    -- Admins can view and manage conversations in their school
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = office_hours_conversations.school_id AND role = 'admin')
    OR
    -- Students can view their own conversations
    student_id = (SELECT auth.uid())
    OR
    -- Teachers can view conversations with their students
    teacher_id = (SELECT auth.uid())
);

CREATE POLICY "Office hours conversations update access" ON public.office_hours_conversations
FOR UPDATE USING (
    -- Admins and teachers can update
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = office_hours_conversations.school_id AND role IN ('admin', 'teacher'))
);

DROP POLICY IF EXISTS "Admins can view and manage conversations in their school" ON public.office_hours_conversations;
DROP POLICY IF EXISTS "Students can create conversations with teachers from their scho" ON public.office_hours_conversations;
DROP POLICY IF EXISTS "Students can view their own conversations" ON public.office_hours_conversations;
DROP POLICY IF EXISTS "Teachers can view conversations with their students" ON public.office_hours_conversations;
DROP POLICY IF EXISTS "Teachers can update conversation status" ON public.office_hours_conversations;

-- OFFICE_HOURS_MESSAGES: Consolidate
CREATE POLICY "Office hours messages insert access" ON public.office_hours_messages
FOR INSERT WITH CHECK (
    -- Students and teachers can send messages in their conversations
    EXISTS (SELECT 1 FROM public.office_hours_conversations WHERE id = office_hours_messages.conversation_id 
            AND (student_id = (SELECT auth.uid()) OR teacher_id = (SELECT auth.uid())))
);

CREATE POLICY "Office hours messages view access" ON public.office_hours_messages
FOR SELECT USING (
    -- Admins can view messages in their school
    EXISTS (SELECT 1 FROM public.office_hours_conversations c WHERE c.id = office_hours_messages.conversation_id 
            AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = c.school_id AND role = 'admin'))
    OR
    -- Conversation participants can view messages
    EXISTS (SELECT 1 FROM public.office_hours_conversations WHERE id = office_hours_messages.conversation_id 
            AND (student_id = (SELECT auth.uid()) OR teacher_id = (SELECT auth.uid())))
);

DROP POLICY IF EXISTS "Students can send messages in their conversations" ON public.office_hours_messages;
DROP POLICY IF EXISTS "Teachers can send messages in their conversations" ON public.office_hours_messages;
DROP POLICY IF EXISTS "Admins can view messages in their school" ON public.office_hours_messages;
DROP POLICY IF EXISTS "Conversation participants can view messages" ON public.office_hours_messages;

-- PARENT_CHILD_RELATIONSHIPS: Consolidate
CREATE POLICY "Parent child relationships view access" ON public.parent_child_relationships
FOR SELECT USING (
    parent_id = (SELECT auth.uid()) OR child_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Parents can view their own relationships" ON public.parent_child_relationships;
DROP POLICY IF EXISTS "Students can view their parent relationships" ON public.parent_child_relationships;

-- POLL_ANSWERS: Consolidate
CREATE POLICY "Poll answers view access" ON public.poll_answers
FOR SELECT USING (
    -- Admins and teachers can view answers for their school
    EXISTS (SELECT 1 FROM public.poll_responses pr 
            JOIN public.polls p ON pr.poll_id = p.id 
            WHERE pr.id = poll_answers.response_id 
            AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = p.school_id AND role IN ('admin', 'teacher')))
    OR
    -- Users can view answers for their responses
    EXISTS (SELECT 1 FROM public.poll_responses WHERE id = poll_answers.response_id AND user_id = (SELECT auth.uid()))
);

DROP POLICY IF EXISTS "Admins and teachers can view answers for their school" ON public.poll_answers;
DROP POLICY IF EXISTS "Users can manage answers for their responses" ON public.poll_answers;

-- POLL_RESPONSES: Consolidate
CREATE POLICY "Poll responses view access" ON public.poll_responses
FOR SELECT USING (
    -- Admins and teachers can view responses for their school polls
    EXISTS (SELECT 1 FROM public.polls WHERE id = poll_responses.poll_id 
            AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = polls.school_id AND role IN ('admin', 'teacher')))
    OR
    -- Users can view their own responses
    user_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Admins and teachers can view responses for their school polls" ON public.poll_responses;
DROP POLICY IF EXISTS "Users can view their own responses" ON public.poll_responses;

-- POLLS: Consolidate
CREATE POLICY "Polls view access" ON public.polls
FOR SELECT USING (
    -- Admins can manage polls for their school
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = polls.school_id AND role = 'admin')
    OR
    -- Teachers can view polls for their school
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = polls.school_id AND role = 'teacher')
    OR
    -- Users can view active polls targeted to them
    (is_active = true AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.school_id = polls.school_id 
             AND (p.role = ANY(target_roles) OR 'all' = ANY(target_roles))))
);

DROP POLICY IF EXISTS "Admins can manage polls for their school" ON public.polls;
DROP POLICY IF EXISTS "Teachers can view polls for their school" ON public.polls;
DROP POLICY IF EXISTS "Users can view active polls targeted to them" ON public.polls;

-- QUEST_SUBMISSIONS: Consolidate
CREATE POLICY "Quest submissions insert access" ON public.quest_submissions
FOR INSERT WITH CHECK (
    student_id = (SELECT auth.uid())
);

CREATE POLICY "Quest submissions view access" ON public.quest_submissions
FOR SELECT USING (
    -- Students can view their own submissions
    student_id = (SELECT auth.uid())
    OR
    -- Teachers can review submissions in their school
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = quest_submissions.school_id AND role IN ('admin', 'teacher'))
);

DROP POLICY IF EXISTS "Students can create their own quest submissions" ON public.quest_submissions;
DROP POLICY IF EXISTS "Students can view their own quest submissions" ON public.quest_submissions;
DROP POLICY IF EXISTS "Teachers can review quest submissions in their school" ON public.quest_submissions;

-- SCHOOL_ANNOUNCEMENTS: Remove old admin policy
DROP POLICY IF EXISTS "Admins can manage school announcements" ON public.school_announcements;

-- SCHOOL_CLASSES: Consolidate
CREATE POLICY "School classes view access" ON public.school_classes
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = school_classes.school_id)
);

DROP POLICY IF EXISTS "Admins and teachers can manage classes" ON public.school_classes;
DROP POLICY IF EXISTS "School members can view classes" ON public.school_classes;

-- SCHOOL_DETAILS: Consolidate
CREATE POLICY "School details view access" ON public.school_details
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = school_details.school_id)
);

DROP POLICY IF EXISTS "School details are editable by school admins" ON public.school_details;
DROP POLICY IF EXISTS "School details are viewable by school members" ON public.school_details;

-- SCHOOL_GEMINI_CONFIG: Consolidate all CRUD operations
CREATE POLICY "School gemini config full access" ON public.school_gemini_config
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = school_gemini_config.school_id AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can manage their school's Gemini config" ON public.school_gemini_config;
DROP POLICY IF EXISTS "Service role can access all school Gemini configs" ON public.school_gemini_config;

-- SCHOOLS: Consolidate
CREATE POLICY "Schools view access" ON public.schools
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = schools.id)
);

DROP POLICY IF EXISTS "Admins can read their school" ON public.schools;
DROP POLICY IF EXISTS "Teachers can read their school" ON public.schools;

-- STUDENT_ACHIEVEMENT_STATS: Consolidate
CREATE POLICY "Student achievement stats view access" ON public.student_achievement_stats
FOR SELECT USING (
    student_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Students can view their own achievement stats" ON public.student_achievement_stats;
DROP POLICY IF EXISTS "System can manage achievement stats" ON public.student_achievement_stats;

-- STUDENT_BADGE_ACHIEVEMENTS: Consolidate
CREATE POLICY "Student badge achievements view access" ON public.student_badge_achievements
FOR SELECT USING (
    -- School community can view
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = student_badge_achievements.school_id)
);

DROP POLICY IF EXISTS "School community can view badge achievements" ON public.student_badge_achievements;
DROP POLICY IF EXISTS "Students can view their own badge achievements" ON public.student_badge_achievements;

-- STUDENT_CLASS_ASSIGNMENTS: Consolidate
CREATE POLICY "Student class assignments view access" ON public.student_class_assignments
FOR SELECT USING (
    -- Admins can view all
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = student_class_assignments.school_id AND role = 'admin')
    OR
    -- Students can view their own
    student_id = (SELECT auth.uid())
    OR
    -- Teachers can view assignments for their classes
    EXISTS (SELECT 1 FROM public.teacher_class_assignments WHERE teacher_id = (SELECT auth.uid()) AND class_id = student_class_assignments.class_id)
);

DROP POLICY IF EXISTS "Admins can view all student class assignments" ON public.student_class_assignments;
DROP POLICY IF EXISTS "Students can view their own class assignments" ON public.student_class_assignments;
DROP POLICY IF EXISTS "Teachers can view class assignments for their classes" ON public.student_class_assignments;

-- STUDENT_EXAM_SESSIONS: Consolidate
CREATE POLICY "Student exam sessions view access" ON public.student_exam_sessions
FOR SELECT USING (
    -- Students can view their own sessions
    student_id = (SELECT auth.uid())
    OR
    -- Teachers can view sessions for their exams
    EXISTS (SELECT 1 FROM public.examinations WHERE id = student_exam_sessions.exam_id AND teacher_id = (SELECT auth.uid()))
);

DROP POLICY IF EXISTS "Students can manage their own sessions" ON public.student_exam_sessions;
DROP POLICY IF EXISTS "Teachers can view sessions for their exams" ON public.student_exam_sessions;

-- Continue in next part due to length...

-- Verification
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT schemaname, tablename, cmd, COUNT(*) as policy_count
        FROM pg_policies
        WHERE schemaname = 'public'
        GROUP BY schemaname, tablename, cmd, roles
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count = 0 THEN
        RAISE NOTICE '✅ SUCCESS: No duplicate permissive policies remain!';
    ELSE
        RAISE WARNING '⚠️ Warning: % tables still have duplicate policies', duplicate_count;
    END IF;
END $$;
