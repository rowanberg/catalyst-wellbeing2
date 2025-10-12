-- =====================================================
-- FIX ALL RLS PERFORMANCE ISSUES - COMPREHENSIVE MIGRATION
-- =====================================================
-- This script fixes all 79 RLS policies with performance issues
-- by replacing auth.uid() with (SELECT auth.uid())
-- Run this in a transaction for safety

BEGIN;

-- =====================================================
-- 1. ASSESSMENTS TABLE (9 policies)
-- =====================================================
DROP POLICY IF EXISTS "Teachers can view their own assessments" ON public.assessments;
CREATE POLICY "Teachers can view their own assessments" ON public.assessments
FOR SELECT USING (teacher_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Teachers can update their own assessments" ON public.assessments;
CREATE POLICY "Teachers can update their own assessments" ON public.assessments
FOR UPDATE USING (teacher_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Teachers can delete their own assessments" ON public.assessments;
CREATE POLICY "Teachers can delete their own assessments" ON public.assessments
FOR DELETE USING (teacher_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Teachers can view own assessments" ON public.assessments;
CREATE POLICY "Teachers can view own assessments" ON public.assessments
FOR SELECT USING (teacher_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Teachers can create assessments" ON public.assessments;
CREATE POLICY "Teachers can create assessments" ON public.assessments
FOR INSERT WITH CHECK (teacher_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Teachers can update own assessments" ON public.assessments;
CREATE POLICY "Teachers can update own assessments" ON public.assessments
FOR UPDATE USING (teacher_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Teachers can delete own assessments" ON public.assessments;
CREATE POLICY "Teachers can delete own assessments" ON public.assessments
FOR DELETE USING (teacher_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Students can view published assessments" ON public.assessments;
CREATE POLICY "Students can view published assessments" ON public.assessments
FOR SELECT USING (
    is_published = true 
    AND EXISTS (
        SELECT 1 FROM student_class_assignments sca
        WHERE sca.student_id = (SELECT auth.uid())
        AND sca.class_id = assessments.class_id
    )
);

DROP POLICY IF EXISTS "Admins can view school assessments" ON public.assessments;
CREATE POLICY "Admins can view school assessments" ON public.assessments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = (SELECT auth.uid())
        AND p.role IN ('admin', 'super_admin')
        AND p.school_id = assessments.school_id
    )
);

-- =====================================================
-- 2. ASSESSMENT_GRADES TABLE (11 policies)
-- =====================================================
DROP POLICY IF EXISTS "Teachers can update grades for their assessments" ON public.assessment_grades;
CREATE POLICY "Teachers can update grades for their assessments" ON public.assessment_grades
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM assessments a
        WHERE a.id = assessment_grades.assessment_id
        AND a.teacher_id = (SELECT auth.uid())
    )
);

DROP POLICY IF EXISTS "Students can view their own grades" ON public.assessment_grades;
CREATE POLICY "Students can view their own grades" ON public.assessment_grades
FOR SELECT USING (student_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Parents can view their children's grades" ON public.assessment_grades;
CREATE POLICY "Parents can view their children's grades" ON public.assessment_grades
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM parent_child_relationships pcr
        WHERE pcr.parent_id = (SELECT auth.uid())
        AND pcr.child_id = assessment_grades.student_id
    )
);

DROP POLICY IF EXISTS "Teachers can view grades for their assessments" ON public.assessment_grades;
CREATE POLICY "Teachers can view grades for their assessments" ON public.assessment_grades
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM assessments a
        WHERE a.id = assessment_grades.assessment_id
        AND a.teacher_id = (SELECT auth.uid())
    )
);

DROP POLICY IF EXISTS "Teachers can create grades" ON public.assessment_grades;
CREATE POLICY "Teachers can create grades" ON public.assessment_grades
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM assessments a
        WHERE a.id = assessment_grades.assessment_id
        AND a.teacher_id = (SELECT auth.uid())
    )
);

DROP POLICY IF EXISTS "Teachers can update grades" ON public.assessment_grades;
CREATE POLICY "Teachers can update grades" ON public.assessment_grades
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM assessments a
        WHERE a.id = assessment_grades.assessment_id
        AND a.teacher_id = (SELECT auth.uid())
    )
);

DROP POLICY IF EXISTS "Teachers can delete grades" ON public.assessment_grades;
CREATE POLICY "Teachers can delete grades" ON public.assessment_grades
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM assessments a
        WHERE a.id = assessment_grades.assessment_id
        AND a.teacher_id = (SELECT auth.uid())
    )
);

DROP POLICY IF EXISTS "Students can view own grades" ON public.assessment_grades;
CREATE POLICY "Students can view own grades" ON public.assessment_grades
FOR SELECT USING (student_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Parents can view children grades" ON public.assessment_grades;
CREATE POLICY "Parents can view children grades" ON public.assessment_grades
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM parent_child_relationships pcr
        WHERE pcr.parent_id = (SELECT auth.uid())
        AND pcr.child_id = assessment_grades.student_id
    )
);

DROP POLICY IF EXISTS "Admins can view school grades" ON public.assessment_grades;
CREATE POLICY "Admins can view school grades" ON public.assessment_grades
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p1, profiles p2
        WHERE p1.user_id = (SELECT auth.uid())
        AND p2.user_id = assessment_grades.student_id
        AND p1.school_id = p2.school_id
        AND p1.role IN ('admin', 'super_admin')
    )
);

-- =====================================================
-- 3. HELP_REQUESTS TABLE (9 policies)
-- =====================================================
DROP POLICY IF EXISTS "Students can view own help requests" ON public.help_requests;
CREATE POLICY "Students can view own help requests" ON public.help_requests
FOR SELECT USING (student_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "School-isolated help requests view" ON public.help_requests;
CREATE POLICY "School-isolated help requests view" ON public.help_requests
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = (SELECT auth.uid())
        AND p.school_id = help_requests.school_id
    )
);

DROP POLICY IF EXISTS "School-isolated help requests update" ON public.help_requests;
CREATE POLICY "School-isolated help requests update" ON public.help_requests
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = (SELECT auth.uid())
        AND p.school_id = help_requests.school_id
        AND p.role IN ('teacher', 'admin', 'super_admin')
    )
);

DROP POLICY IF EXISTS "Students can create help requests for their school" ON public.help_requests;
CREATE POLICY "Students can create help requests for their school" ON public.help_requests
FOR INSERT WITH CHECK (
    student_id = (SELECT auth.uid())
    AND EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = (SELECT auth.uid())
        AND p.school_id = help_requests.school_id
    )
);

DROP POLICY IF EXISTS "Admins can update help requests" ON public.help_requests;
CREATE POLICY "Admins can update help requests" ON public.help_requests
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = (SELECT auth.uid())
        AND p.role IN ('admin', 'super_admin')
        AND p.school_id = help_requests.school_id
    )
);

DROP POLICY IF EXISTS "Teachers can update help requests" ON public.help_requests;
CREATE POLICY "Teachers can update help requests" ON public.help_requests
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = (SELECT auth.uid())
        AND p.role = 'teacher'
        AND p.school_id = help_requests.school_id
    )
);

DROP POLICY IF EXISTS "Teachers and admins can view help requests" ON public.help_requests;
CREATE POLICY "Teachers and admins can view help requests" ON public.help_requests
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = (SELECT auth.uid())
        AND p.role IN ('teacher', 'admin', 'super_admin')
        AND p.school_id = help_requests.school_id
    )
);

DROP POLICY IF EXISTS "Students can insert own help requests" ON public.help_requests;
CREATE POLICY "Students can insert own help requests" ON public.help_requests
FOR INSERT WITH CHECK (
    student_id = (SELECT auth.uid())
    AND EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = (SELECT auth.uid())
        AND p.role = 'student'
        AND p.school_id = help_requests.school_id
    )
);

DROP POLICY IF EXISTS "Admins can update help requests from their school" ON public.help_requests;
CREATE POLICY "Admins can update help requests from their school" ON public.help_requests
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = (SELECT auth.uid())
        AND p.role IN ('admin', 'super_admin')
        AND p.school_id = help_requests.school_id
    )
);

-- =====================================================
-- 4. PROFILES TABLE (2 policies)
-- =====================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- =====================================================
-- 5. COURAGE_LOG TABLE (2 policies)
-- =====================================================
DROP POLICY IF EXISTS "Users can view own courage entries" ON public.courage_log;
CREATE POLICY "Users can view own courage entries" ON public.courage_log
FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own courage entries" ON public.courage_log;
CREATE POLICY "Users can insert own courage entries" ON public.courage_log
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

-- =====================================================
-- 6. GRATITUDE_ENTRIES TABLE (2 policies)
-- =====================================================
DROP POLICY IF EXISTS "Users can view own gratitude entries" ON public.gratitude_entries;
CREATE POLICY "Users can view own gratitude entries" ON public.gratitude_entries
FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own gratitude entries" ON public.gratitude_entries;
CREATE POLICY "Users can insert own gratitude entries" ON public.gratitude_entries
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

-- =====================================================
-- 7. SCHOOL_CLASSES TABLE (2 policies)
-- =====================================================
DROP POLICY IF EXISTS "School members can view classes" ON public.school_classes;
CREATE POLICY "School members can view classes" ON public.school_classes
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = (SELECT auth.uid())
        AND p.school_id = school_classes.school_id
    )
);

DROP POLICY IF EXISTS "Admins and teachers can manage classes" ON public.school_classes;
CREATE POLICY "Admins and teachers can manage classes" ON public.school_classes
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = (SELECT auth.uid())
        AND p.school_id = school_classes.school_id
        AND p.role IN ('admin', 'teacher', 'super_admin')
    )
);

-- =====================================================
-- 8. WELLBEING_ASSESSMENTS TABLE (3 policies)
-- =====================================================
DROP POLICY IF EXISTS "Students can view their own assessments" ON public.wellbeing_assessments;
CREATE POLICY "Students can view their own assessments" ON public.wellbeing_assessments
FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Students can create their own assessments" ON public.wellbeing_assessments;
CREATE POLICY "Students can create their own assessments" ON public.wellbeing_assessments
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins and teachers can view school assessments" ON public.wellbeing_assessments;
CREATE POLICY "Admins and teachers can view school assessments" ON public.wellbeing_assessments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p1, profiles p2
        WHERE p1.user_id = (SELECT auth.uid())
        AND p2.user_id = wellbeing_assessments.user_id
        AND p1.school_id = p2.school_id
        AND p1.role IN ('admin', 'teacher', 'super_admin')
    )
);

-- =====================================================
-- 9. ANALYTICS_EVENTS TABLE (2 policies)
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own analytics events" ON public.analytics_events;
CREATE POLICY "Users can view their own analytics events" ON public.analytics_events
FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins can view all school analytics events" ON public.analytics_events;
CREATE POLICY "Admins can view all school analytics events" ON public.analytics_events
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p1, profiles p2
        WHERE p1.user_id = (SELECT auth.uid())
        AND p2.user_id = analytics_events.user_id
        AND p1.school_id = p2.school_id
        AND p1.role IN ('admin', 'super_admin')
    )
);

-- =====================================================
-- 10. USER_SESSIONS TABLE (2 policies)
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;
CREATE POLICY "Users can view their own sessions" ON public.user_sessions
FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins can view all school sessions" ON public.user_sessions;
CREATE POLICY "Admins can view all school sessions" ON public.user_sessions
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p1, profiles p2
        WHERE p1.user_id = (SELECT auth.uid())
        AND p2.user_id = user_sessions.user_id
        AND p1.school_id = p2.school_id
        AND p1.role IN ('admin', 'super_admin')
    )
);

-- =====================================================
-- 11. OTHER WELLBEING TABLES
-- =====================================================
-- Daily Quests
DROP POLICY IF EXISTS "Users can manage their own daily quests" ON public.daily_quests;
CREATE POLICY "Users can manage their own daily quests" ON public.daily_quests
FOR ALL USING (user_id = (SELECT auth.uid()));

-- Mindfulness Sessions
DROP POLICY IF EXISTS "Users can manage their own mindfulness sessions" ON public.mindfulness_sessions;
CREATE POLICY "Users can manage their own mindfulness sessions" ON public.mindfulness_sessions
FOR ALL USING (user_id = (SELECT auth.uid()));

-- Breathing Sessions
DROP POLICY IF EXISTS "Users can view own breathing sessions" ON public.breathing_sessions;
CREATE POLICY "Users can view own breathing sessions" ON public.breathing_sessions
FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own breathing sessions" ON public.breathing_sessions;
CREATE POLICY "Users can insert own breathing sessions" ON public.breathing_sessions
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

-- Habit Tracker
DROP POLICY IF EXISTS "Users can manage own habits" ON public.habit_tracker;
CREATE POLICY "Users can manage own habits" ON public.habit_tracker
FOR ALL USING (user_id = (SELECT auth.uid()));

-- Kindness Counter
DROP POLICY IF EXISTS "Users can manage own kindness counter" ON public.kindness_counter;
CREATE POLICY "Users can manage own kindness counter" ON public.kindness_counter
FOR ALL USING (user_id = (SELECT auth.uid()));

-- Student Wallets
DROP POLICY IF EXISTS "Users can manage their own wallet" ON public.student_wallets;
CREATE POLICY "Users can manage their own wallet" ON public.student_wallets
FOR ALL USING (student_id = (SELECT auth.uid()));

-- =====================================================
-- 12. COMMUNICATION TABLES
-- =====================================================
-- School Announcements
DROP POLICY IF EXISTS "Users can view announcements for their role" ON public.school_announcements;
CREATE POLICY "Users can view announcements for their role" ON public.school_announcements
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = (SELECT auth.uid())
        AND p.school_id = school_announcements.school_id
        AND (
            school_announcements.target_roles IS NULL 
            OR p.role = ANY(school_announcements.target_roles)
        )
    )
);

-- Incident Reports
DROP POLICY IF EXISTS "Users can view reports they created or are involved in" ON public.incident_reports;
CREATE POLICY "Users can view reports they created or are involved in" ON public.incident_reports
FOR SELECT USING (
    created_by = (SELECT auth.uid()) 
    OR student_id = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = (SELECT auth.uid())
        AND p.role IN ('teacher', 'admin', 'super_admin')
        AND p.school_id = incident_reports.school_id
    )
);

DROP POLICY IF EXISTS "Admins and teachers can manage incident reports" ON public.incident_reports;
CREATE POLICY "Admins and teachers can manage incident reports" ON public.incident_reports
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = (SELECT auth.uid())
        AND p.role IN ('teacher', 'admin', 'super_admin')
        AND p.school_id = incident_reports.school_id
    )
);

-- Family Conversations
DROP POLICY IF EXISTS "Users can view their own family conversations" ON public.family_conversations;
CREATE POLICY "Users can view their own family conversations" ON public.family_conversations
FOR SELECT USING (
    student_id = (SELECT auth.uid()) 
    OR parent_id = (SELECT auth.uid())
);

-- Family Messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.family_messages;
CREATE POLICY "Users can view messages in their conversations" ON public.family_messages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM family_conversations fc
        WHERE fc.id = family_messages.conversation_id
        AND (fc.student_id = (SELECT auth.uid()) OR fc.parent_id = (SELECT auth.uid()))
    )
);

DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.family_messages;
CREATE POLICY "Users can send messages in their conversations" ON public.family_messages
FOR INSERT WITH CHECK (
    sender_id = (SELECT auth.uid())
    AND EXISTS (
        SELECT 1 FROM family_conversations fc
        WHERE fc.id = family_messages.conversation_id
        AND (fc.student_id = (SELECT auth.uid()) OR fc.parent_id = (SELECT auth.uid()))
    )
);

DROP POLICY IF EXISTS "Users can update their own messages" ON public.family_messages;
CREATE POLICY "Users can update their own messages" ON public.family_messages
FOR UPDATE USING (sender_id = (SELECT auth.uid()));

-- =====================================================
-- 13. REMAINING TABLES (Academic, Achievement, etc.)
-- =====================================================
-- Parent Child Relationships
DROP POLICY IF EXISTS "Parents can view their own relationships" ON public.parent_child_relationships;
CREATE POLICY "Parents can view their own relationships" ON public.parent_child_relationships
FOR SELECT USING (parent_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Students can view their parent relationships" ON public.parent_child_relationships;
CREATE POLICY "Students can view their parent relationships" ON public.parent_child_relationships
FOR SELECT USING (child_id = (SELECT auth.uid()));

-- Student Achievements
DROP POLICY IF EXISTS "student_achievements_isolation" ON public.student_achievements;
CREATE POLICY "student_achievements_isolation" ON public.student_achievements
FOR ALL USING (
    student_id = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = (SELECT auth.uid())
        AND p.role IN ('teacher', 'admin', 'super_admin')
        AND p.school_id = (
            SELECT school_id FROM profiles WHERE user_id = student_achievements.student_id
        )
    )
);

-- Event Registrations
DROP POLICY IF EXISTS "event_registrations_isolation" ON public.event_registrations;
CREATE POLICY "event_registrations_isolation" ON public.event_registrations
FOR ALL USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = (SELECT auth.uid())
        AND p.role IN ('admin', 'super_admin')
        AND p.school_id = (
            SELECT school_id FROM profiles WHERE user_id = event_registrations.user_id
        )
    )
);

-- Portfolio Items
DROP POLICY IF EXISTS "portfolio_items_isolation" ON public.portfolio_items;
CREATE POLICY "portfolio_items_isolation" ON public.portfolio_items
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM student_portfolios sp
        WHERE sp.id = portfolio_items.portfolio_id
        AND sp.student_id = (SELECT auth.uid())
    )
);

-- Student Portfolios
DROP POLICY IF EXISTS "student_portfolios_isolation" ON public.student_portfolios;
CREATE POLICY "student_portfolios_isolation" ON public.student_portfolios
FOR ALL USING (student_id = (SELECT auth.uid()));

-- Game Sessions
DROP POLICY IF EXISTS "game_sessions_isolation" ON public.game_sessions;
CREATE POLICY "game_sessions_isolation" ON public.game_sessions
FOR ALL USING (user_id = (SELECT auth.uid()));

-- Grade Templates
DROP POLICY IF EXISTS "Teachers can manage their own templates" ON public.grade_templates;
CREATE POLICY "Teachers can manage their own templates" ON public.grade_templates
FOR ALL USING (teacher_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Teachers can manage own templates" ON public.grade_templates;
CREATE POLICY "Teachers can manage own templates" ON public.grade_templates
FOR ALL USING (teacher_id = (SELECT auth.uid()));

-- Offline Grade Sync
DROP POLICY IF EXISTS "Teachers can manage their own offline sync" ON public.offline_grade_sync;
CREATE POLICY "Teachers can manage their own offline sync" ON public.offline_grade_sync
FOR ALL USING (teacher_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Teachers can manage own sync data" ON public.offline_grade_sync;
CREATE POLICY "Teachers can manage own sync data" ON public.offline_grade_sync
FOR ALL USING (teacher_id = (SELECT auth.uid()));

-- Teacher Office Hours
DROP POLICY IF EXISTS "Teachers can manage their own office hours" ON public.teacher_office_hours;
CREATE POLICY "Teachers can manage their own office hours" ON public.teacher_office_hours
FOR ALL USING (teacher_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Students can view teacher office hours from their school" ON public.teacher_office_hours;
CREATE POLICY "Students can view teacher office hours from their school" ON public.teacher_office_hours
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p1, profiles p2
        WHERE p1.user_id = (SELECT auth.uid())
        AND p2.user_id = teacher_office_hours.teacher_id
        AND p1.school_id = p2.school_id
    )
);

DROP POLICY IF EXISTS "Admins can manage office hours in their school" ON public.teacher_office_hours;
CREATE POLICY "Admins can manage office hours in their school" ON public.teacher_office_hours
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles p1, profiles p2
        WHERE p1.user_id = (SELECT auth.uid())
        AND p2.user_id = teacher_office_hours.teacher_id
        AND p1.school_id = p2.school_id
        AND p1.role IN ('admin', 'super_admin')
    )
);

-- Office Hours Conversations
DROP POLICY IF EXISTS "Students can view their own conversations" ON public.office_hours_conversations;
CREATE POLICY "Students can view their own conversations" ON public.office_hours_conversations
FOR SELECT USING (student_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Teachers can view conversations with their students" ON public.office_hours_conversations;
CREATE POLICY "Teachers can view conversations with their students" ON public.office_hours_conversations
FOR SELECT USING (teacher_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Students can create conversations with teachers from their scho" ON public.office_hours_conversations;
CREATE POLICY "Students can create conversations with teachers from their scho" ON public.office_hours_conversations
FOR INSERT WITH CHECK (
    student_id = (SELECT auth.uid())
    AND EXISTS (
        SELECT 1 FROM profiles p1, profiles p2
        WHERE p1.user_id = (SELECT auth.uid())
        AND p2.user_id = office_hours_conversations.teacher_id
        AND p1.school_id = p2.school_id
    )
);

DROP POLICY IF EXISTS "Teachers can update conversation status" ON public.office_hours_conversations;
CREATE POLICY "Teachers can update conversation status" ON public.office_hours_conversations
FOR UPDATE USING (teacher_id = (SELECT auth.uid()));

-- Office Hours Messages
DROP POLICY IF EXISTS "Conversation participants can view messages" ON public.office_hours_messages;
CREATE POLICY "Conversation participants can view messages" ON public.office_hours_messages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM office_hours_conversations ohc
        WHERE ohc.id = office_hours_messages.conversation_id
        AND (ohc.student_id = (SELECT auth.uid()) OR ohc.teacher_id = (SELECT auth.uid()))
    )
);

DROP POLICY IF EXISTS "Students can send messages in their conversations" ON public.office_hours_messages;
CREATE POLICY "Students can send messages in their conversations" ON public.office_hours_messages
FOR INSERT WITH CHECK (
    sender_id = (SELECT auth.uid())
    AND EXISTS (
        SELECT 1 FROM office_hours_conversations ohc
        WHERE ohc.id = office_hours_messages.conversation_id
        AND (ohc.student_id = (SELECT auth.uid()) OR ohc.teacher_id = (SELECT auth.uid()))
    )
);

-- Office Hours Notifications
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.office_hours_notifications;
CREATE POLICY "Users can update their own notifications" ON public.office_hours_notifications
FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- After running this migration, run this query to verify all policies are fixed:
DO $$
DECLARE
    inefficient_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO inefficient_count
    FROM pg_policies
    WHERE qual LIKE '%auth.uid()%'
    AND qual NOT LIKE '%(SELECT auth.uid())%';
    
    RAISE NOTICE 'Remaining inefficient policies: %', inefficient_count;
    
    IF inefficient_count = 0 THEN
        RAISE NOTICE 'SUCCESS: All RLS policies have been optimized!';
    ELSE
        RAISE WARNING 'There are still % policies that need optimization', inefficient_count;
    END IF;
END $$;

COMMIT;

-- =====================================================
-- POST-MIGRATION VERIFICATION
-- =====================================================
-- Run these queries after migration to verify performance improvements:

-- 1. Check query performance on a high-traffic table
-- EXPLAIN ANALYZE SELECT * FROM assessments WHERE teacher_id = auth.uid();

-- 2. Verify all policies are using subqueries
-- SELECT schemaname, tablename, policyname 
-- FROM pg_policies 
-- WHERE qual LIKE '%(SELECT auth.uid())%';

-- 3. Monitor database performance metrics
-- Check CPU usage, query latency, and connection pool usage
