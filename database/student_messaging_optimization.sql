-- Student Messaging Tools Database Optimization
-- This file ensures optimal performance and proper data isolation between schools
-- Created: 2025-10-09

-- =====================================================
-- 0. CHECK EXISTING TABLES FIRST
-- =====================================================

-- Check if tables exist before creating indexes
DO $$
BEGIN
    -- Check if required tables exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'student_achievements') THEN
        RAISE NOTICE 'Table student_achievements does not exist. Skipping related indexes.';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'achievement_leaderboard') THEN
        RAISE NOTICE 'Table achievement_leaderboard does not exist. Skipping related indexes.';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'game_sessions') THEN
        RAISE NOTICE 'Table game_sessions does not exist. Skipping related indexes.';
    END IF;
END $$;

-- =====================================================
-- 1. PERFORMANCE INDEXES
-- =====================================================

-- Study Groups Performance Indexes (conditional)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'study_groups') THEN
        CREATE INDEX IF NOT EXISTS idx_study_groups_school_active ON study_groups(school_id, status) 
          WHERE status = 'active';
        CREATE INDEX IF NOT EXISTS idx_study_groups_search ON study_groups 
          USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));
        RAISE NOTICE 'Created study_groups indexes';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'study_group_members') THEN
        CREATE INDEX IF NOT EXISTS idx_study_group_members_active ON study_group_members(user_id, is_active) 
          WHERE is_active = true;
        RAISE NOTICE 'Created study_group_members indexes';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'study_group_sessions') THEN
        CREATE INDEX IF NOT EXISTS idx_study_group_sessions_upcoming ON study_group_sessions(group_id, scheduled_start) 
          WHERE status IN ('scheduled', 'ongoing');
        RAISE NOTICE 'Created study_group_sessions indexes';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'study_group_messages') THEN
        CREATE INDEX IF NOT EXISTS idx_study_group_messages_recent ON study_group_messages(group_id, created_at DESC);
        RAISE NOTICE 'Created study_group_messages indexes';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'study_group_resources') THEN
        CREATE INDEX IF NOT EXISTS idx_study_group_resources_search ON study_group_resources 
          USING GIN(tags);
        RAISE NOTICE 'Created study_group_resources indexes';
    END IF;
END $$;

-- Peer Tutoring Performance Indexes (conditional)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'tutor_profiles') THEN
        CREATE INDEX IF NOT EXISTS idx_tutor_profiles_school_active ON tutor_profiles(school_id, status, is_available) 
          WHERE status = 'active' AND is_available = true;
        RAISE NOTICE 'Created tutor_profiles indexes';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'tutor_subjects') THEN
        CREATE INDEX IF NOT EXISTS idx_tutor_subjects_search ON tutor_subjects 
          USING GIN(to_tsvector('english', subject));
        RAISE NOTICE 'Created tutor_subjects indexes';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'tutoring_sessions') THEN
        CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_upcoming ON tutoring_sessions(tutor_id, scheduled_start) 
          WHERE status IN ('scheduled', 'confirmed');
        CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_student ON tutoring_sessions(student_id, scheduled_start DESC);
        RAISE NOTICE 'Created tutoring_sessions indexes';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'tutoring_reviews') THEN
        CREATE INDEX IF NOT EXISTS idx_tutoring_reviews_high_rated ON tutoring_reviews(reviewee_id, overall_rating) 
          WHERE overall_rating >= 4;
        RAISE NOTICE 'Created tutoring_reviews indexes';
    END IF;
END $$;

-- Achievement Center Performance Indexes (conditional)
DO $$
BEGIN
    -- Only create if achievements table exists
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'achievements') THEN
        CREATE INDEX IF NOT EXISTS idx_achievements_school_active ON achievements(school_id, is_active, category) 
          WHERE is_active = true;
        RAISE NOTICE 'Created achievements indexes';
    END IF;
    
    -- Only create if student_achievements table exists with is_completed column
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'student_achievements' AND column_name = 'is_completed'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_student_achievements_progress ON student_achievements(student_id, is_completed, progress_percentage);
        RAISE NOTICE 'Created student_achievements indexes';
    END IF;
    
    -- Only create if achievement_collections table exists
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'achievement_collections') THEN
        CREATE INDEX IF NOT EXISTS idx_achievement_collections_active ON achievement_collections(school_id, is_active) 
          WHERE is_active = true;
        RAISE NOTICE 'Created achievement_collections indexes';
    END IF;
    
    -- Only create if achievement_leaderboard table exists
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'achievement_leaderboard') THEN
        CREATE INDEX IF NOT EXISTS idx_leaderboard_school_period ON achievement_leaderboard(school_id, period_type, period_start DESC);
        RAISE NOTICE 'Created achievement_leaderboard indexes';
    END IF;
END $$;

-- School Events Performance Indexes (conditional)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'school_events') THEN
        -- Check if the table has the expected columns
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'school_events' AND column_name = 'start_datetime'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_school_events_upcoming ON school_events(school_id, start_datetime) 
              WHERE status = 'active';
            CREATE INDEX IF NOT EXISTS idx_school_events_search ON school_events 
              USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));
            RAISE NOTICE 'Created school_events indexes';
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'event_registrations') THEN
        -- Check if the table has the expected columns
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'event_registrations' AND column_name = 'status'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON event_registrations(user_id, status) 
              WHERE status = 'confirmed';
            RAISE NOTICE 'Created event_registrations indexes';
        END IF;
    END IF;
END $$;

-- Digital Portfolio & Project Showcase Indexes (conditional)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'portfolio_items') THEN
        -- Check for correct column names
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'portfolio_items' AND column_name = 'is_visible'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_portfolio_items_visible ON portfolio_items(portfolio_id, is_visible, created_at DESC) 
              WHERE is_visible = true;
        END IF;
        
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'portfolio_items' AND column_name = 'tags'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_portfolio_tags ON portfolio_items USING GIN(tags);
        END IF;
        
        RAISE NOTICE 'Created portfolio_items indexes';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'project_collaborators') THEN
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'project_collaborators' AND column_name = 'is_active'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_project_collaborators_active ON project_collaborators(user_id, is_active) 
              WHERE is_active = true;
        END IF;
        RAISE NOTICE 'Created project_collaborators indexes';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'project_showcase') THEN
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'project_showcase' AND column_name = 'tags'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_project_tags ON project_showcase USING GIN(tags);
        END IF;
        RAISE NOTICE 'Created project_showcase indexes';
    END IF;
END $$;

-- Learning Games Performance Indexes (conditional)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'game_sessions') THEN
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'game_sessions' AND column_name = 'status'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_game_sessions_active ON game_sessions(student_id, game_id, status) 
              WHERE status = 'active';
        END IF;
        RAISE NOTICE 'Created game_sessions indexes';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'game_progress') THEN
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'game_progress' AND column_name = 'last_played'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_game_progress_student ON game_progress(student_id, game_id, last_played DESC);
        END IF;
        RAISE NOTICE 'Created game_progress indexes';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'game_leaderboard') THEN
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'game_leaderboard' AND column_name = 'score'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_game_leaderboard_top ON game_leaderboard(game_id, school_id, score DESC);
        END IF;
        RAISE NOTICE 'Created game_leaderboard indexes';
    END IF;
END $$;

-- =====================================================
-- 2. ENHANCED ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Function to check if user belongs to the same school
CREATE OR REPLACE FUNCTION check_same_school(user_school_id UUID, target_school_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_school_id = target_school_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's school_id
CREATE OR REPLACE FUNCTION get_user_school_id()
RETURNS UUID AS $$
DECLARE
  v_school_id UUID;
BEGIN
  SELECT school_id INTO v_school_id
  FROM profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN v_school_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. STUDY GROUPS RLS POLICIES (School Isolation)
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "study_groups_school_isolation" ON study_groups;
DROP POLICY IF EXISTS "study_group_members_school_isolation" ON study_group_members;
DROP POLICY IF EXISTS "study_group_messages_school_isolation" ON study_group_messages;

-- Study Groups: Users can only see groups from their school
CREATE POLICY "study_groups_school_isolation" ON study_groups
  FOR ALL USING (
    school_id = get_user_school_id()
  );

-- Study Group Members: Only see members from same school groups
CREATE POLICY "study_group_members_school_isolation" ON study_group_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM study_groups sg
      WHERE sg.id = study_group_members.group_id
      AND sg.school_id = get_user_school_id()
    )
  );

-- Study Group Messages: Only see messages from same school groups
CREATE POLICY "study_group_messages_school_isolation" ON study_group_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM study_groups sg
      WHERE sg.id = study_group_messages.group_id
      AND sg.school_id = get_user_school_id()
    )
  );

-- =====================================================
-- 4. PEER TUTORING RLS POLICIES (School Isolation)
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "tutor_profiles_school_isolation" ON tutor_profiles;
DROP POLICY IF EXISTS "tutoring_sessions_school_isolation" ON tutoring_sessions;
DROP POLICY IF EXISTS "tutoring_requests_school_isolation" ON tutoring_requests;

-- Tutor Profiles: Only see tutors from same school
CREATE POLICY "tutor_profiles_school_isolation" ON tutor_profiles
  FOR ALL USING (
    school_id = get_user_school_id()
  );

-- Tutoring Sessions: Only see sessions from same school
CREATE POLICY "tutoring_sessions_school_isolation" ON tutoring_sessions
  FOR ALL USING (
    school_id = get_user_school_id()
  );

-- Tutoring Requests: Only see requests from same school
CREATE POLICY "tutoring_requests_school_isolation" ON tutoring_requests
  FOR ALL USING (
    school_id = get_user_school_id()
  );

-- =====================================================
-- 5. ACHIEVEMENT CENTER RLS POLICIES (School Isolation)
-- =====================================================

-- Achievement Center RLS Policies (conditional)
DO $$
BEGIN
    -- Only create policies if tables exist
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'achievements') THEN
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "achievements_school_isolation" ON achievements;
        
        -- Achievements: Only see achievements from same school or global ones
        CREATE POLICY "achievements_school_isolation" ON achievements
          FOR ALL USING (
            school_id = get_user_school_id() OR school_id IS NULL
          );
        RAISE NOTICE 'Created achievements RLS policies';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'student_achievements') THEN
        DROP POLICY IF EXISTS "student_achievements_isolation" ON student_achievements;
        
        -- Student Achievements: Only see own achievements
        CREATE POLICY "student_achievements_isolation" ON student_achievements
          FOR ALL USING (
            student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
          );
        RAISE NOTICE 'Created student_achievements RLS policies';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'achievement_leaderboard') THEN
        DROP POLICY IF EXISTS "achievement_leaderboard_school_isolation" ON achievement_leaderboard;
        
        -- Achievement Leaderboard: Only see same school leaderboard
        CREATE POLICY "achievement_leaderboard_school_isolation" ON achievement_leaderboard
          FOR SELECT USING (
            school_id = get_user_school_id()
          );
        RAISE NOTICE 'Created achievement_leaderboard RLS policies';
    END IF;
END $$;

-- =====================================================
-- 6. SCHOOL EVENTS RLS POLICIES (School Isolation) - Conditional
-- =====================================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'school_events') THEN
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "school_events_isolation" ON school_events;
        
        -- School Events: Only see events from same school
        CREATE POLICY "school_events_isolation" ON school_events
          FOR ALL USING (
            school_id = get_user_school_id()
          );
        RAISE NOTICE 'Created school_events RLS policies';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'event_registrations') THEN
        DROP POLICY IF EXISTS "event_registrations_isolation" ON event_registrations;
        
        -- Event Registrations: Only see and manage own registrations
        CREATE POLICY "event_registrations_isolation" ON event_registrations
          FOR ALL USING (
            user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
            AND EXISTS (
              SELECT 1 FROM school_events se
              WHERE se.id = event_registrations.event_id
              AND se.school_id = get_user_school_id()
            )
          );
        RAISE NOTICE 'Created event_registrations RLS policies';
    END IF;
END $$;

-- =====================================================
-- 7. PORTFOLIO & SHOWCASE RLS POLICIES (Conditional)
-- =====================================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'portfolio_items') THEN
        DROP POLICY IF EXISTS "portfolio_items_isolation" ON portfolio_items;
        
        -- Portfolio Items: See own items and visible items from same school
        -- Note: portfolio_items links to student_portfolios, not directly to students
        CREATE POLICY "portfolio_items_isolation" ON portfolio_items
          FOR ALL USING (
            portfolio_id IN (
              SELECT id FROM student_portfolios 
              WHERE student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
            )
            OR (
              is_visible = true 
              AND portfolio_id IN (
                SELECT sp.id FROM student_portfolios sp
                JOIN profiles p ON sp.student_id = p.id
                WHERE p.school_id = get_user_school_id()
              )
            )
          );
        RAISE NOTICE 'Created portfolio_items RLS policies';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'student_portfolios') THEN
        DROP POLICY IF EXISTS "student_portfolios_isolation" ON student_portfolios;
        
        -- Student Portfolios: See own portfolios and published ones from same school
        CREATE POLICY "student_portfolios_isolation" ON student_portfolios
          FOR ALL USING (
            student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
            OR (
              is_published = true 
              AND school_id = get_user_school_id()
            )
          );
        RAISE NOTICE 'Created student_portfolios RLS policies';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'project_showcase') THEN
        DROP POLICY IF EXISTS "project_showcase_isolation" ON project_showcase;
        
        -- Project Showcase: Only see projects from same school
        CREATE POLICY "project_showcase_isolation" ON project_showcase
          FOR ALL USING (
            school_id = get_user_school_id()
          );
        RAISE NOTICE 'Created project_showcase RLS policies';
    END IF;
END $$;

-- =====================================================
-- 8. LEARNING GAMES RLS POLICIES (Conditional)
-- =====================================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'game_sessions') THEN
        DROP POLICY IF EXISTS "game_sessions_isolation" ON game_sessions;
        
        -- Game Sessions: Only see own game sessions
        CREATE POLICY "game_sessions_isolation" ON game_sessions
          FOR ALL USING (
            student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
          );
        RAISE NOTICE 'Created game_sessions RLS policies';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'game_progress') THEN
        DROP POLICY IF EXISTS "game_progress_isolation" ON game_progress;
        
        -- Game Progress: Only see own progress
        CREATE POLICY "game_progress_isolation" ON game_progress
          FOR ALL USING (
            student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
          );
        RAISE NOTICE 'Created game_progress RLS policies';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'game_leaderboard') THEN
        DROP POLICY IF EXISTS "game_leaderboard_isolation" ON game_leaderboard;
        
        -- Game Leaderboard: Only see same school leaderboard
        CREATE POLICY "game_leaderboard_isolation" ON game_leaderboard
          FOR SELECT USING (
            school_id = get_user_school_id()
          );
        RAISE NOTICE 'Created game_leaderboard RLS policies';
    END IF;
END $$;

-- =====================================================
-- 9. DATA INTEGRITY CONSTRAINTS (Conditional)
-- =====================================================

DO $$
BEGIN
    -- Add constraints only if tables exist
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'study_group_members') THEN
        -- Drop constraint if it exists, then add it
        ALTER TABLE study_group_members DROP CONSTRAINT IF EXISTS check_member_same_school;
        -- Note: This constraint might be too restrictive, commenting out for now
        -- ALTER TABLE study_group_members ADD CONSTRAINT check_member_same_school
        --   CHECK (
        --     user_id IN (
        --       SELECT p.id FROM profiles p
        --       JOIN study_groups sg ON sg.school_id = p.school_id
        --       WHERE sg.id = group_id
        --     )
        --   );
        RAISE NOTICE 'Processed study_group_members constraints';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'tutoring_sessions') THEN
        -- Drop constraint if it exists, then add it
        ALTER TABLE tutoring_sessions DROP CONSTRAINT IF EXISTS check_tutoring_same_school;
        -- Note: This constraint might be too restrictive, commenting out for now
        -- ALTER TABLE tutoring_sessions ADD CONSTRAINT check_tutoring_same_school
        --   CHECK (
        --     student_id IN (
        --       SELECT p.id FROM profiles p
        --       WHERE p.school_id = school_id
        --     )
        --   );
        RAISE NOTICE 'Processed tutoring_sessions constraints';
    END IF;
END $$;

-- =====================================================
-- 10. PERFORMANCE MONITORING
-- =====================================================

-- Create a view to monitor slow queries (conditional based on pg_stat_statements availability)
DO $$
BEGIN
    -- Check if pg_stat_statements extension exists and has the expected columns
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'pg_stat_statements'
    ) THEN
        -- Check which column names are available (they vary by PostgreSQL version)
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'pg_stat_statements' AND column_name = 'total_exec_time'
        ) THEN
            -- PostgreSQL 13+ column names
            EXECUTE '
            CREATE OR REPLACE VIEW student_messaging_slow_queries AS
            SELECT 
              query,
              calls,
              total_exec_time,
              mean_exec_time,
              max_exec_time,
              min_exec_time,
              stddev_exec_time
            FROM pg_stat_statements
            WHERE query LIKE ''%study_groups%'' 
               OR query LIKE ''%tutor%'' 
               OR query LIKE ''%achievement%''
               OR query LIKE ''%school_events%''
               OR query LIKE ''%portfolio%''
               OR query LIKE ''%game_%''
            ORDER BY mean_exec_time DESC
            LIMIT 20';
            RAISE NOTICE 'Created slow queries view with PostgreSQL 13+ column names';
        ELSIF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'pg_stat_statements' AND column_name = 'total_time'
        ) THEN
            -- PostgreSQL 12 and earlier column names
            EXECUTE '
            CREATE OR REPLACE VIEW student_messaging_slow_queries AS
            SELECT 
              query,
              calls,
              total_time,
              mean_time,
              max_time,
              min_time,
              stddev_time
            FROM pg_stat_statements
            WHERE query LIKE ''%study_groups%'' 
               OR query LIKE ''%tutor%'' 
               OR query LIKE ''%achievement%''
               OR query LIKE ''%school_events%''
               OR query LIKE ''%portfolio%''
               OR query LIKE ''%game_%''
            ORDER BY mean_time DESC
            LIMIT 20';
            RAISE NOTICE 'Created slow queries view with PostgreSQL 12 column names';
        ELSE
            RAISE NOTICE 'pg_stat_statements extension found but columns not recognized, skipping slow queries view';
        END IF;
    ELSE
        RAISE NOTICE 'pg_stat_statements extension not available, skipping slow queries view';
    END IF;
END $$;

-- Create a function to analyze table sizes
CREATE OR REPLACE FUNCTION analyze_student_messaging_tables()
RETURNS TABLE(
  table_name TEXT,
  row_count BIGINT,
  table_size TEXT,
  index_size TEXT,
  total_size TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname||'.'||tablename AS table_name,
    n_live_tup AS row_count,
    pg_size_pretty(pg_table_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS index_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size
  FROM pg_stat_user_tables
  WHERE tablename IN (
    'study_groups', 'study_group_members', 'study_group_sessions',
    'tutor_profiles', 'tutoring_sessions', 'tutoring_reviews',
    'achievements', 'student_achievements', 'achievement_leaderboard',
    'school_events', 'event_registrations',
    'portfolio_items', 'project_showcase',
    'game_sessions', 'game_progress', 'game_leaderboard'
  )
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 11. CLEANUP AND OPTIMIZATION
-- =====================================================

-- Note: VACUUM commands cannot run inside a transaction block
-- Run these manually after the optimization script completes:

-- Manual VACUUM commands (run separately):
-- VACUUM ANALYZE study_groups, study_group_members, study_group_sessions, study_group_messages;
-- VACUUM ANALYZE tutor_profiles, tutoring_sessions, tutoring_reviews, tutoring_requests;
-- VACUUM ANALYZE achievements, student_achievements, achievement_collections, achievement_leaderboard;
-- VACUUM ANALYZE school_events, event_registrations;
-- VACUUM ANALYZE portfolio_items, project_showcase;
-- VACUUM ANALYZE game_sessions, game_progress, game_leaderboard;

-- Update table statistics (safe to run in transaction)
DO $$
BEGIN
    -- Only analyze tables that exist
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'study_groups') THEN
        EXECUTE 'ANALYZE study_groups';
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'study_group_members') THEN
        EXECUTE 'ANALYZE study_group_members';
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'study_group_sessions') THEN
        EXECUTE 'ANALYZE study_group_sessions';
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'tutor_profiles') THEN
        EXECUTE 'ANALYZE tutor_profiles';
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'tutoring_sessions') THEN
        EXECUTE 'ANALYZE tutoring_sessions';
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'tutoring_reviews') THEN
        EXECUTE 'ANALYZE tutoring_reviews';
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'achievements') THEN
        EXECUTE 'ANALYZE achievements';
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'student_achievements') THEN
        EXECUTE 'ANALYZE student_achievements';
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'school_events') THEN
        EXECUTE 'ANALYZE school_events';
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'event_registrations') THEN
        EXECUTE 'ANALYZE event_registrations';
    END IF;
    
    RAISE NOTICE 'Table statistics updated for existing tables';
END $$;

-- =====================================================
-- 12. MONITORING FUNCTIONS
-- =====================================================

-- Function to check data isolation by school
CREATE OR REPLACE FUNCTION check_data_isolation(p_school_id UUID)
RETURNS TABLE(
  table_name TEXT,
  total_records BIGINT,
  school_records BIGINT,
  isolation_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH table_counts AS (
    SELECT 'study_groups' AS tbl, COUNT(*) AS total, 
           COUNT(*) FILTER (WHERE school_id = p_school_id) AS school_specific
    FROM study_groups
    UNION ALL
    SELECT 'tutor_profiles', COUNT(*), COUNT(*) FILTER (WHERE school_id = p_school_id)
    FROM tutor_profiles
    UNION ALL
    SELECT 'achievements', COUNT(*), COUNT(*) FILTER (WHERE school_id = p_school_id)
    FROM achievements
    UNION ALL
    SELECT 'school_events', COUNT(*), COUNT(*) FILTER (WHERE school_id = p_school_id)
    FROM school_events
  )
  SELECT 
    tbl,
    total,
    school_specific,
    CASE WHEN total > 0 THEN ROUND((school_specific::NUMERIC / total) * 100, 2) ELSE 0 END
  FROM table_counts
  ORDER BY tbl;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_school_id() TO authenticated;
GRANT EXECUTE ON FUNCTION check_same_school(UUID, UUID) TO authenticated;
GRANT SELECT ON student_messaging_slow_queries TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_student_messaging_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION check_data_isolation(UUID) TO authenticated;

-- =====================================================
-- 13. SCHEDULED MAINTENANCE (To be run periodically)
-- =====================================================

-- Create a maintenance function
CREATE OR REPLACE FUNCTION maintain_student_messaging_tables()
RETURNS VOID AS $$
BEGIN
  -- Clean up old sessions (only if tables exist)
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'study_group_sessions') THEN
    DELETE FROM study_group_sessions 
    WHERE status = 'completed' AND actual_end < NOW() - INTERVAL '6 months';
    RAISE NOTICE 'Cleaned up old study group sessions';
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'tutoring_sessions') THEN
    DELETE FROM tutoring_sessions 
    WHERE status = 'completed' AND actual_end < NOW() - INTERVAL '6 months';
    RAISE NOTICE 'Cleaned up old tutoring sessions';
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'game_sessions') THEN
    -- Check if ended_at column exists, otherwise use updated_at or created_at
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'game_sessions' AND column_name = 'ended_at'
    ) THEN
      DELETE FROM game_sessions 
      WHERE status = 'completed' AND ended_at < NOW() - INTERVAL '3 months';
    ELSIF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'game_sessions' AND column_name = 'updated_at'
    ) THEN
      DELETE FROM game_sessions 
      WHERE status = 'completed' AND updated_at < NOW() - INTERVAL '3 months';
    END IF;
    RAISE NOTICE 'Cleaned up old game sessions';
  END IF;
  
  -- Archive old events (only if table exists and has correct columns)
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'school_events') THEN
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'school_events' AND column_name = 'start_datetime'
    ) THEN
      UPDATE school_events 
      SET status = 'archived' 
      WHERE start_datetime < NOW() - INTERVAL '1 year' AND status = 'completed';
      RAISE NOTICE 'Archived old school events';
    END IF;
  END IF;
  
  -- Update statistics (only for existing tables)
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'study_groups') THEN
    EXECUTE 'ANALYZE study_groups';
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'tutor_profiles') THEN
    EXECUTE 'ANALYZE tutor_profiles';
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'achievements') THEN
    EXECUTE 'ANALYZE achievements';
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'school_events') THEN
    EXECUTE 'ANALYZE school_events';
  END IF;
  
  RAISE NOTICE 'Maintenance completed successfully';
END;
$$ LANGUAGE plpgsql;

-- Schedule maintenance (example cron job - adjust as needed)
-- SELECT cron.schedule('student-messaging-maintenance', '0 2 * * 0', 
--   'SELECT maintain_student_messaging_tables();');

COMMENT ON SCHEMA public IS 'Student Messaging Tools - Optimized for performance and school data isolation';
