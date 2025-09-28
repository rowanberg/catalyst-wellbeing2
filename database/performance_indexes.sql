-- Performance Optimization Indexes for Student Announcements Page
-- Execute this in Supabase SQL Editor to improve query performance

-- IMPORTANT: Check which announcements table exists first
-- This script handles both 'announcements' and 'school_announcements' tables

-- Check if school_announcements table exists and create indexes accordingly
DO $$
BEGIN
    -- Index for school_announcements (if exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'school_announcements') THEN
        -- Index for school_announcements by school and audience (most common query)
        CREATE INDEX IF NOT EXISTS idx_school_announcements_school_audience 
        ON school_announcements(school_id, target_audience) 
        WHERE is_active = true;

        -- Index for school_announcements by priority and date
        CREATE INDEX IF NOT EXISTS idx_school_announcements_priority_date 
        ON school_announcements(priority, created_at DESC) 
        WHERE is_active = true;

        -- Composite index for school_announcements filtering
        CREATE INDEX IF NOT EXISTS idx_school_announcements_filter 
        ON school_announcements(school_id, target_audience, is_active, expires_at, created_at DESC);

        RAISE NOTICE 'Created indexes for school_announcements table';
    END IF;

    -- Index for announcements table (if exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'announcements') THEN
        -- Index for announcements by school and audience (most common query)
        CREATE INDEX IF NOT EXISTS idx_announcements_school_audience 
        ON announcements(school_id, target_audience) 
        WHERE is_active = true;

        -- Index for announcements by priority and date
        CREATE INDEX IF NOT EXISTS idx_announcements_priority_date 
        ON announcements(priority, created_at DESC) 
        WHERE is_active = true;

        -- Composite index for announcements filtering
        CREATE INDEX IF NOT EXISTS idx_announcements_filter 
        ON announcements(school_id, target_audience, is_active, expires_at, created_at DESC);

        RAISE NOTICE 'Created indexes for announcements table';
    END IF;
END $$;

-- Index for polls by school and status (conditional)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'polls') THEN
        CREATE INDEX IF NOT EXISTS idx_polls_school_status 
        ON polls(school_id, status) 
        WHERE status = 'active';
        
        RAISE NOTICE 'Created indexes for polls table';
        
        -- Create indexes for poll_responses table (using actual column structure)
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'poll_responses') THEN
            -- Index for poll responses by respondent and poll (for checking if user responded)
            CREATE INDEX IF NOT EXISTS idx_poll_responses_respondent_poll 
            ON poll_responses(respondent_id, poll_id);
            
            -- Index for poll responses by school (for admin queries)
            CREATE INDEX IF NOT EXISTS idx_poll_responses_school_poll 
            ON poll_responses(school_id, poll_id);
            
            -- Index for poll responses by submission date (for analytics)
            CREATE INDEX IF NOT EXISTS idx_poll_responses_submitted_date 
            ON poll_responses(submitted_at DESC);
            
            -- Index for complete responses only
            CREATE INDEX IF NOT EXISTS idx_poll_responses_complete 
            ON poll_responses(poll_id, is_complete) 
            WHERE is_complete = true;
            
            RAISE NOTICE 'Created indexes for poll_responses table';
        ELSE
            RAISE NOTICE 'poll_responses table does not exist';
        END IF;
        
        -- Create indexes for poll_questions table
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'poll_questions') THEN
            -- Index for poll questions by poll and order
            CREATE INDEX IF NOT EXISTS idx_poll_questions_poll_order 
            ON poll_questions(poll_id, order_index);
            
            -- Index for required questions
            CREATE INDEX IF NOT EXISTS idx_poll_questions_required 
            ON poll_questions(poll_id, is_required) 
            WHERE is_required = true;
            
            RAISE NOTICE 'Created indexes for poll_questions table';
        ELSE
            RAISE NOTICE 'poll_questions table does not exist';
        END IF;
    END IF;
END $$;

-- Conditional indexes for other tables
DO $$
BEGIN
    -- Index for student class assignments (fixes 0 rows issue)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'student_class_assignments') THEN
        CREATE INDEX IF NOT EXISTS idx_student_assignments_student 
        ON student_class_assignments(student_id, is_active);
        RAISE NOTICE 'Created index for student_class_assignments';
    END IF;

    -- Index for mood tracking by user and date
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'mood_tracking') THEN
        CREATE INDEX IF NOT EXISTS idx_mood_tracking_user_date 
        ON mood_tracking(user_id, date DESC);
        RAISE NOTICE 'Created index for mood_tracking';
    END IF;

    -- Index for daily quests by user and date
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'daily_quests') THEN
        CREATE INDEX IF NOT EXISTS idx_daily_quests_user_date 
        ON daily_quests(user_id, date DESC);
        RAISE NOTICE 'Created index for daily_quests';
    END IF;

    -- Index for profiles by school (improves authentication queries)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        CREATE INDEX IF NOT EXISTS idx_profiles_school_role 
        ON profiles(school_id, role);
        RAISE NOTICE 'Created index for profiles';
    END IF;

    -- Index for help requests by school (admin messaging)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'help_requests') THEN
        CREATE INDEX IF NOT EXISTS idx_help_requests_school 
        ON help_requests(school_id, created_at DESC);
        RAISE NOTICE 'Created index for help_requests';
    END IF;
END $$;

-- Analyze tables to update statistics (conditional)
DO $$
BEGIN
    -- Only analyze tables that exist
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'announcements') THEN
        EXECUTE 'ANALYZE announcements';
        RAISE NOTICE 'Analyzed announcements table';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'school_announcements') THEN
        EXECUTE 'ANALYZE school_announcements';
        RAISE NOTICE 'Analyzed school_announcements table';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'polls') THEN
        EXECUTE 'ANALYZE polls';
        RAISE NOTICE 'Analyzed polls table';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'student_class_assignments') THEN
        EXECUTE 'ANALYZE student_class_assignments';
        RAISE NOTICE 'Analyzed student_class_assignments table';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'mood_tracking') THEN
        EXECUTE 'ANALYZE mood_tracking';
        RAISE NOTICE 'Analyzed mood_tracking table';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'daily_quests') THEN
        EXECUTE 'ANALYZE daily_quests';
        RAISE NOTICE 'Analyzed daily_quests table';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        EXECUTE 'ANALYZE profiles';
        RAISE NOTICE 'Analyzed profiles table';
    END IF;
END $$;

-- Performance monitoring query (shows existing tables only)
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats 
WHERE schemaname = 'public' 
  AND tablename IN (
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN ('announcements', 'school_announcements', 'polls', 'student_class_assignments', 'profiles', 'mood_tracking', 'daily_quests', 'help_requests')
  )
ORDER BY tablename, attname;

-- Summary of created indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Diagnostic: Show actual table structures for troubleshooting
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('polls', 'poll_responses', 'poll_questions', 'announcements', 'school_announcements')
ORDER BY table_name, ordinal_position;
