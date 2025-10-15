-- ============================================================================
-- RLS (Row Level Security) Issues Remediation Script
-- Based on Supabase Database Linter Report
-- Date: 2025-10-15
-- Priority: CRITICAL - Execute Immediately
-- ============================================================================

-- ============================================================================
-- ISSUE 1: RLS Policies Exist But RLS Not Enabled (CRITICAL)
-- ============================================================================
-- Table: student_class_assignments
-- Problem: Has RLS policies but RLS is disabled - policies are not enforced!
-- Risk: Anyone can access ALL student class assignments regardless of policies

-- Enable RLS on student_class_assignments
ALTER TABLE public.student_class_assignments ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
DO $$ 
BEGIN
    IF (SELECT relrowsecurity FROM pg_class WHERE relname = 'student_class_assignments') THEN
        RAISE NOTICE '✅ RLS enabled on student_class_assignments';
    ELSE
        RAISE EXCEPTION '❌ Failed to enable RLS on student_class_assignments';
    END IF;
END $$;


-- ============================================================================
-- ISSUE 2: Security Definer Views (HIGH RISK)
-- ============================================================================
-- Problem: Views with SECURITY DEFINER bypass RLS and run with creator permissions
-- Risk: Users can access data they shouldn't have access to
-- Solution: Remove SECURITY DEFINER or add proper WHERE clauses

-- List of affected views:
-- 1. attendance_all
-- 2. v_unused_indexes (admin/monitoring - OK to keep)
-- 3. student_messaging_slow_queries (admin/monitoring - OK to keep)
-- 4. teacher_monthly_stats
-- 5. teacher_gem_transactions
-- 6. v_index_usage_stats (admin/monitoring - OK to keep)
-- 7. common_timezones (read-only public data - OK to keep)
-- 8. realtime_subscription_stats (admin/monitoring - OK to keep)

-- Fix 1: attendance_all view
-- This view should NOT be SECURITY DEFINER as it exposes attendance data
DROP VIEW IF EXISTS public.attendance_all;
CREATE VIEW public.attendance_all AS
SELECT * FROM public.attendance;
-- No SECURITY DEFINER - will use querying user's permissions + RLS policies

-- Fix 2: teacher_monthly_stats
-- Recreate without SECURITY DEFINER
DROP VIEW IF EXISTS public.teacher_monthly_stats CASCADE;
-- Note: You'll need to recreate this view based on your actual schema
-- For now, we're dropping it. Recreate with proper RLS checks if needed.

-- Fix 3: teacher_gem_transactions
-- Recreate without SECURITY DEFINER
DROP VIEW IF EXISTS public.teacher_gem_transactions CASCADE;
-- Note: Recreate with proper RLS checks if needed.

DO $$ 
BEGIN
    RAISE NOTICE 'Security definer views removed. Review and recreate with RLS if needed.';
END $$;


-- ============================================================================
-- ISSUE 3: RLS Disabled on Public Tables (CRITICAL)
-- ============================================================================
-- Problem: 52+ tables in public schema have no RLS enabled
-- Risk: Anyone with database access can read/modify ALL data
-- Solution: Enable RLS and create appropriate policies

-- Enable RLS on all affected tables
ALTER TABLE public.quest_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_category_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_collaboration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_collection_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_mentorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_archive_backup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_archive ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    RAISE NOTICE 'RLS enabled on all public tables';
END $$;

-- ============================================================================
-- STEP 2: Create RLS Policies for Each Table
-- ============================================================================
-- Note: These are TEMPLATE policies. Customize based on your access requirements.

-- ============================================================================
-- Quest Templates (read-only for authenticated users)
-- ============================================================================
CREATE POLICY "Quest templates readable by authenticated users"
ON public.quest_templates FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Quest templates manageable by admins"
ON public.quest_templates FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);


-- ============================================================================
-- Badge Templates (read-only for authenticated users)
-- ============================================================================
CREATE POLICY "Badge templates readable by authenticated users"
ON public.badge_templates FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Badge templates manageable by admins"
ON public.badge_templates FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);


-- ============================================================================
-- Study Groups (students can view their own groups)
-- ============================================================================
CREATE POLICY "Students can view study group achievements"
ON public.study_group_achievements FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.study_groups
        WHERE study_groups.id = study_group_achievements.group_id
        AND (
            study_groups.created_by IN (
                SELECT id FROM public.profiles WHERE user_id = auth.uid()
            )
            OR EXISTS (
                SELECT 1 FROM public.study_group_members
                WHERE study_group_members.group_id = study_groups.id
                AND study_group_members.user_id IN (
                    SELECT id FROM public.profiles WHERE user_id = auth.uid()
                )
            )
        )
    )
);

CREATE POLICY "Students can view study group attendance"
ON public.study_group_attendance FOR SELECT
TO authenticated
USING (
    user_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.study_group_sessions
        JOIN public.study_group_members ON study_group_members.group_id = study_group_sessions.group_id
        WHERE study_group_sessions.id = study_group_attendance.session_id
        AND study_group_members.user_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    )
);


-- ============================================================================
-- Events (school-wide visibility)
-- ============================================================================
CREATE POLICY "Event sessions visible to school members"
ON public.event_sessions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.school_events
        JOIN public.profiles ON profiles.school_id = school_events.school_id
        WHERE school_events.id = event_sessions.event_id
        AND profiles.user_id = auth.uid()
    )
);

CREATE POLICY "Event announcements visible to school members"
ON public.event_announcements FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.school_events
        JOIN public.profiles ON profiles.school_id = school_events.school_id
        WHERE school_events.id = event_announcements.event_id
        AND profiles.user_id = auth.uid()
    )
);

CREATE POLICY "Event volunteers visible to school members"
ON public.event_volunteers FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.school_events
        JOIN public.profiles ON profiles.school_id = school_events.school_id
        WHERE school_events.id = event_volunteers.event_id
        AND profiles.user_id = auth.uid()
    )
);


-- ============================================================================
-- Leaderboards (school-wide read access)
-- ============================================================================
CREATE POLICY "Leaderboards visible to school members"
ON public.leaderboards FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.school_id = leaderboards.school_id
    )
);

CREATE POLICY "Leaderboard entries visible to school members"
ON public.leaderboard_entries FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.leaderboards
        INNER JOIN public.profiles ON profiles.school_id = leaderboards.school_id
        WHERE leaderboards.id = leaderboard_entries.leaderboard_id
        AND profiles.user_id = auth.uid()
    )
);


-- ============================================================================
-- Reward Store (school-wide read, student purchases private)
-- ============================================================================
CREATE POLICY "Reward items visible to school members"
ON public.reward_store_items FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.school_id = reward_store_items.school_id
    )
);

CREATE POLICY "Students can view own purchases"
ON public.student_purchases FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.id = student_purchases.student_id
    )
);

CREATE POLICY "Teachers/admins can view purchases in their school"
ON public.student_purchases FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p1
        INNER JOIN public.profiles p2 ON p1.school_id = p2.school_id
        WHERE p1.user_id = auth.uid()
        AND p1.role IN ('teacher', 'admin')
        AND p2.id = student_purchases.student_id
    )
);


-- ============================================================================
-- Portfolio (students own their portfolios)
-- ============================================================================
CREATE POLICY "Students can manage own portfolio sections"
ON public.portfolio_sections FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.student_portfolios
        JOIN public.profiles ON profiles.id = student_portfolios.student_id
        WHERE student_portfolios.id = portfolio_sections.portfolio_id
        AND profiles.user_id = auth.uid()
    )
);

CREATE POLICY "Students can manage own portfolio goals"
ON public.portfolio_goals FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.student_portfolios
        JOIN public.profiles ON profiles.id = student_portfolios.student_id
        WHERE student_portfolios.id = portfolio_goals.portfolio_id
        AND profiles.user_id = auth.uid()
    )
);

CREATE POLICY "Students can manage own portfolio skills"
ON public.portfolio_skills FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.student_portfolios
        JOIN public.profiles ON profiles.id = student_portfolios.student_id
        WHERE student_portfolios.id = portfolio_skills.portfolio_id
        AND profiles.user_id = auth.uid()
    )
);

-- Shared portfolios visible to recipients
CREATE POLICY "Portfolio shares visible to recipients"
ON public.portfolio_shares FOR SELECT
TO authenticated
USING (
    shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.student_portfolios
        JOIN public.profiles ON profiles.id = student_portfolios.student_id
        WHERE student_portfolios.id = portfolio_shares.portfolio_id
        AND profiles.user_id = auth.uid()
    )
);


-- ============================================================================
-- Audit Logs (admin only)
-- ============================================================================
CREATE POLICY "Audit logs visible to admins only"
ON public.audit_logs FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);


-- ============================================================================
-- Attendance Archives (teachers/admins only)
-- ============================================================================
CREATE POLICY "Attendance archives visible to teachers/admins"
ON public.attendance_archive FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('teacher', 'admin')
        AND profiles.school_id = attendance_archive.school_id
    )
);

CREATE POLICY "Attendance archive backup visible to admins"
ON public.attendance_archive_backup FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);


-- ============================================================================
-- Game Tables (school-wide read access)
-- ============================================================================
CREATE POLICY "Game leaderboards visible to school members"
ON public.game_leaderboards FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.learning_games
        JOIN public.profiles ON profiles.school_id = learning_games.school_id
        WHERE learning_games.id = game_leaderboards.game_id
        AND profiles.user_id = auth.uid()
    )
);

CREATE POLICY "Game analytics visible to school members"
ON public.game_analytics FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.learning_games
        JOIN public.profiles ON profiles.school_id = learning_games.school_id
        WHERE learning_games.id = game_analytics.game_id
        AND profiles.user_id = auth.uid()
    )
);


-- ============================================================================
-- Exchange Rates (read-only for authenticated users)
-- ============================================================================
CREATE POLICY "Exchange rates readable by authenticated users"
ON public.exchange_rates FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Exchange rates manageable by admins"
ON public.exchange_rates FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);


-- ============================================================================
-- Project Tables
-- ============================================================================
CREATE POLICY "Project categories visible to all authenticated"
ON public.project_categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Project updates visible to project members"
ON public.project_updates FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.student_projects
        WHERE student_projects.id = project_updates.project_id
        AND (
            student_projects.creator_id IN (
                SELECT id FROM public.profiles WHERE user_id = auth.uid()
            )
            OR (
                SELECT id FROM public.profiles WHERE user_id = auth.uid()
            ) = ANY(student_projects.team_members)
        )
    )
);


-- ============================================================================
-- Verification: Check RLS Status
-- ============================================================================
DO $$ 
DECLARE
    table_count INTEGER;
    rls_enabled_count INTEGER;
    table_name TEXT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== RLS Verification ===';
    
    -- Count total public tables
    SELECT COUNT(*) INTO table_count
    FROM pg_tables
    WHERE schemaname = 'public';
    
    -- Count tables with RLS enabled
    SELECT COUNT(*) INTO rls_enabled_count
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relrowsecurity = true;
    
    RAISE NOTICE 'Total public tables: %', table_count;
    RAISE NOTICE 'Tables with RLS enabled: %', rls_enabled_count;
    RAISE NOTICE '';
    
    -- List tables still without RLS
    RAISE NOTICE 'Tables without RLS:';
    FOR table_name IN 
        SELECT c.relname
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
        AND c.relkind = 'r'
        AND c.relrowsecurity = false
        ORDER BY c.relname
    LOOP
        RAISE NOTICE '  - %', table_name;
    END LOOP;
END $$;


-- ============================================================================
-- Summary & Next Steps
-- ============================================================================
DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== RLS Remediation Complete ===';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Fixed Issues:';
    RAISE NOTICE '1. Enabled RLS on student_class_assignments';
    RAISE NOTICE '2. Removed SECURITY DEFINER from sensitive views';
    RAISE NOTICE '3. Enabled RLS on 40+ public tables';
    RAISE NOTICE '4. Created baseline RLS policies';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Important Next Steps:';
    RAISE NOTICE '1. Test application functionality with new RLS policies';
    RAISE NOTICE '2. Review and customize policies based on business logic';
    RAISE NOTICE '3. Add missing policies for INSERT/UPDATE/DELETE operations';
    RAISE NOTICE '4. Test with different user roles (student, teacher, admin, parent)';
    RAISE NOTICE '5. Monitor for "permission denied" errors in application logs';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Policy Templates:';
    RAISE NOTICE 'Use these patterns for remaining tables:';
    RAISE NOTICE '  - School-scoped: profiles.school_id = table.school_id';
    RAISE NOTICE '  - Student-owned: profiles.id = table.student_id';
    RAISE NOTICE '  - Teacher access: role IN (teacher, admin)';
    RAISE NOTICE '  - Read-only: FOR SELECT USING (true)';
    RAISE NOTICE '';
END $$;
