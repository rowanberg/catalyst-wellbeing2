-- =====================================================
-- CORRECTED RLS PERFORMANCE FIX - VERIFIED AGAINST ACTUAL SCHEMA
-- =====================================================
-- This script fixes RLS policies with the CORRECT column names
-- Run this instead of the previous fix_all_rls_policies.sql

BEGIN;

-- =====================================================
-- STEP 1: Fix policies that use direct user_id references
-- =====================================================

-- Mood Tracking (user_id column)
DROP POLICY IF EXISTS "Users can manage their own mood tracking" ON public.mood_tracking;
CREATE POLICY "Users can manage their own mood tracking" ON public.mood_tracking
FOR ALL USING (user_id = (SELECT auth.uid()));

-- Daily Quests (user_id column)
DROP POLICY IF EXISTS "Users can manage their own daily quests" ON public.daily_quests;
CREATE POLICY "Users can manage their own daily quests" ON public.daily_quests
FOR ALL USING (user_id = (SELECT auth.uid()));

-- Mindfulness Sessions (user_id column)
DROP POLICY IF EXISTS "Users can manage their own mindfulness sessions" ON public.mindfulness_sessions;
CREATE POLICY "Users can manage their own mindfulness sessions" ON public.mindfulness_sessions
FOR ALL USING (user_id = (SELECT auth.uid()));

-- Analytics Events (user_id column)
DROP POLICY IF EXISTS "Users can view their own analytics events" ON public.analytics_events;
CREATE POLICY "Users can view their own analytics events" ON public.analytics_events
FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins can view all school analytics events" ON public.analytics_events;
CREATE POLICY "Admins can view all school analytics events" ON public.analytics_events
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.user_id = (SELECT auth.uid())
        AND profiles.role IN ('admin', 'super_admin')
        AND profiles.school_id = analytics_events.school_id
    )
);

-- User Sessions (user_id column)
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;
CREATE POLICY "Users can view their own sessions" ON public.user_sessions
FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins can view all school sessions" ON public.user_sessions;
CREATE POLICY "Admins can view all school sessions" ON public.user_sessions
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.user_id = (SELECT auth.uid())
        AND profiles.role IN ('admin', 'super_admin')
        AND profiles.school_id = user_sessions.school_id
    )
);

-- Courage Log (user_id column)
DROP POLICY IF EXISTS "Users can view own courage entries" ON public.courage_log;
CREATE POLICY "Users can view own courage entries" ON public.courage_log
FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own courage entries" ON public.courage_log;
CREATE POLICY "Users can insert own courage entries" ON public.courage_log
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

-- Gratitude Entries (user_id column)
DROP POLICY IF EXISTS "Users can view own gratitude entries" ON public.gratitude_entries;
CREATE POLICY "Users can view own gratitude entries" ON public.gratitude_entries
FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own gratitude entries" ON public.gratitude_entries;
CREATE POLICY "Users can insert own gratitude entries" ON public.gratitude_entries
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

-- Breathing Sessions (user_id column)
DROP POLICY IF EXISTS "Users can view own breathing sessions" ON public.breathing_sessions;
CREATE POLICY "Users can view own breathing sessions" ON public.breathing_sessions
FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own breathing sessions" ON public.breathing_sessions;
CREATE POLICY "Users can insert own breathing sessions" ON public.breathing_sessions
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

-- Habit Tracker (user_id column)
DROP POLICY IF EXISTS "Users can manage own habits" ON public.habit_tracker;
CREATE POLICY "Users can manage own habits" ON public.habit_tracker
FOR ALL USING (user_id = (SELECT auth.uid()));

-- Kindness Counter (user_id column)
DROP POLICY IF EXISTS "Users can manage own kindness counter" ON public.kindness_counter;
CREATE POLICY "Users can manage own kindness counter" ON public.kindness_counter
FOR ALL USING (user_id = (SELECT auth.uid()));

-- =====================================================
-- STEP 2: Fix policies using student_id column
-- =====================================================

-- Wellbeing Assessments (student_id column, NOT user_id)
DROP POLICY IF EXISTS "Students can view their own assessments" ON public.wellbeing_assessments;
CREATE POLICY "Students can view their own assessments" ON public.wellbeing_assessments
FOR SELECT USING (student_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Students can create their own assessments" ON public.wellbeing_assessments;
CREATE POLICY "Students can create their own assessments" ON public.wellbeing_assessments
FOR INSERT WITH CHECK (student_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins and teachers can view school assessments" ON public.wellbeing_assessments;
CREATE POLICY "Admins and teachers can view school assessments" ON public.wellbeing_assessments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.user_id = (SELECT auth.uid())
        AND profiles.school_id = wellbeing_assessments.school_id
        AND profiles.role IN ('admin', 'teacher', 'super_admin')
    )
);

-- Help Requests (student_id column)
DROP POLICY IF EXISTS "Students can view own help requests" ON public.help_requests;
CREATE POLICY "Students can view own help requests" ON public.help_requests
FOR SELECT USING (student_id = (SELECT auth.uid()));

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

-- Student Wallets (student_id column)
DROP POLICY IF EXISTS "Users can manage their own wallet" ON public.student_wallets;
CREATE POLICY "Users can manage their own wallet" ON public.student_wallets
FOR ALL USING (student_id = (SELECT auth.uid()));

-- =====================================================
-- STEP 3: Fix profiles table policies
-- =====================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- =====================================================
-- STEP 4: Fix school_classes policies
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
-- STEP 5: Fix school_announcements policies
-- =====================================================

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

-- =====================================================
-- STEP 6: Fix incident_reports policies
-- =====================================================

DROP POLICY IF EXISTS "Users can view reports they created or are involved in" ON public.incident_reports;
CREATE POLICY "Users can view reports they created or are involved in" ON public.incident_reports
FOR SELECT USING (
    reported_by = (SELECT auth.uid()) 
    OR assigned_to = (SELECT auth.uid())
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

-- =====================================================
-- STEP 7: Fix parent_child_relationships policies
-- =====================================================

DROP POLICY IF EXISTS "Parents can view their own relationships" ON public.parent_child_relationships;
CREATE POLICY "Parents can view their own relationships" ON public.parent_child_relationships
FOR SELECT USING (parent_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Students can view their parent relationships" ON public.parent_child_relationships;
CREATE POLICY "Students can view their parent relationships" ON public.parent_child_relationships
FOR SELECT USING (child_id = (SELECT auth.uid()));

-- =====================================================
-- STEP 8: Fix communication tables (if they exist)
-- =====================================================

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
-- VERIFICATION
-- =====================================================
DO $$
DECLARE
    inefficient_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO inefficient_count
    FROM pg_policies
    WHERE qual LIKE '%auth.uid()%'
    AND qual NOT LIKE '%(SELECT auth.uid())%'
    AND schemaname = 'public';
    
    RAISE NOTICE 'Remaining inefficient policies: %', inefficient_count;
    
    IF inefficient_count = 0 THEN
        RAISE NOTICE '✅ SUCCESS: All RLS policies have been optimized!';
    ELSE
        RAISE WARNING '⚠️ There are still % policies that need optimization', inefficient_count;
        RAISE NOTICE 'Run this query to see which policies remain:';
        RAISE NOTICE 'SELECT schemaname, tablename, policyname FROM pg_policies WHERE qual LIKE ''%%auth.uid()%%'' AND qual NOT LIKE ''%%(SELECT auth.uid())%%'';';
    END IF;
END $$;

COMMIT;

-- =====================================================
-- POST-RUN: Check remaining policies
-- =====================================================
-- Uncomment and run this after the migration:
-- SELECT schemaname, tablename, policyname, qual 
-- FROM pg_policies 
-- WHERE qual LIKE '%auth.uid()%' 
-- AND qual NOT LIKE '%(SELECT auth.uid())%'
-- AND schemaname = 'public';
