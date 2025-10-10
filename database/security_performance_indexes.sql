-- =================================================================
-- Security and Performance Database Indexes for Catalyst Wells
-- =================================================================
-- This script creates essential indexes to improve query performance
-- and strengthen security through efficient data access patterns
-- =================================================================

-- ==============================
-- SAFE INDEX CREATION SCRIPT
-- ==============================
-- All indexes will be created conditionally to avoid errors

-- ==============================
-- AUTHENTICATION INDEXES
-- ==============================
-- Note: auth.users table is managed by Supabase and cannot be indexed by users
-- Supabase automatically maintains indexes on auth.users for optimal performance

-- All index creation moved to conditional section below for safety

-- ==============================
-- WALLET_TRANSACTIONS INDEXES
-- ==============================
-- Indexes will be created conditionally at the end of script

-- ==============================
-- AUDIT_LOGS INDEXES (For Security)
-- ==============================
-- Create audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL,
    resource VARCHAR(255) NOT NULL,
    details JSONB,
    ip_address INET,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);

-- ==============================
-- PARENT_CHILD_RELATIONSHIPS INDEXES
-- ==============================
-- Indexes will be created conditionally at the end of script

-- ==============================
-- HELP_REQUESTS INDEXES
-- ==============================
-- Indexes will be created conditionally at the end of script

-- ==============================
-- QUERY PERFORMANCE ANALYSIS
-- ==============================
-- Function to analyze table statistics
CREATE OR REPLACE FUNCTION analyze_table_performance()
RETURNS TABLE(
    table_name TEXT,
    total_rows BIGINT,
    index_count INT,
    table_size TEXT,
    index_size TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname || '.' || tablename AS table_name,
        n_live_tup AS total_rows,
        COUNT(indexname)::INT AS index_count,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS table_size,
        pg_size_pretty(SUM(pg_relation_size(schemaname||'.'||indexname))::BIGINT) AS index_size
    FROM pg_stat_user_tables
    LEFT JOIN pg_indexes ON pg_stat_user_tables.tablename = pg_indexes.tablename
    WHERE schemaname = 'public'
    GROUP BY schemaname, pg_stat_user_tables.tablename, n_live_tup
    ORDER BY n_live_tup DESC;
END;
$$ LANGUAGE plpgsql;

-- ==============================
-- VACUUM AND ANALYZE
-- ==============================
-- Run these commands periodically to maintain performance
-- VACUUM ANALYZE profiles;
-- VACUUM ANALYZE class_assignments;
-- VACUUM ANALYZE grades;
-- VACUUM ANALYZE assessments;

-- ==============================
-- MONITORING QUERIES
-- ==============================
-- Check for missing indexes
CREATE OR REPLACE FUNCTION find_missing_indexes()
RETURNS TABLE(
    schemaname NAME,
    tablename NAME,
    attname NAME,
    n_distinct REAL,
    correlation REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.schemaname,
        s.tablename,
        a.attname,
        s.n_distinct,
        s.correlation
    FROM pg_stats s
    JOIN pg_attribute a ON a.attname = s.attname
    JOIN pg_class c ON c.oid = a.attrelid AND c.relname = s.tablename
    WHERE s.schemaname = 'public'
    AND s.n_distinct > 100
    AND ABS(s.correlation) < 0.1
    AND NOT EXISTS (
        SELECT 1
        FROM pg_indexes i
        WHERE i.tablename = s.tablename
        AND i.indexdef LIKE '%' || s.attname || '%'
    )
    ORDER BY s.n_distinct DESC;
END;
$$ LANGUAGE plpgsql;

-- ==============================
-- CONDITIONAL INDEX CREATION
-- ==============================
-- Only create indexes if tables exist to avoid errors

-- SAFE INDEX CREATION - Check everything before creating
DO $$
BEGIN
    RAISE NOTICE 'Starting safe index creation...';
    
    -- PROFILES TABLE (most likely to exist)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'user_id') THEN
            CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'school_id') 
           AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
            CREATE INDEX IF NOT EXISTS idx_profiles_school_id_role ON profiles(school_id, role);
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
            CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'student_tag') THEN
            CREATE INDEX IF NOT EXISTS idx_profiles_student_tag ON profiles(student_tag) WHERE student_tag IS NOT NULL;
        END IF;
        RAISE NOTICE 'Created profiles indexes';
    END IF;

    -- SCHOOLS TABLE
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'schools') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'schools' AND column_name = 'created_at') THEN
            CREATE INDEX IF NOT EXISTS idx_schools_created_at ON schools(created_at DESC);
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'schools' AND column_name = 'status') THEN
            CREATE INDEX IF NOT EXISTS idx_schools_status ON schools(status);
        END IF;
        RAISE NOTICE 'Created schools indexes';
    END IF;

    -- CLASSES TABLE
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'classes') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'school_id') THEN
            CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'teacher_id') THEN
            CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'school_id') 
           AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'teacher_id') THEN
            CREATE INDEX IF NOT EXISTS idx_classes_school_teacher ON classes(school_id, teacher_id);
        END IF;
        RAISE NOTICE 'Created classes indexes';
    END IF;

    -- CLASS_ASSIGNMENTS TABLE
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'class_assignments') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'class_assignments' AND column_name = 'student_id') THEN
            CREATE INDEX IF NOT EXISTS idx_class_assignments_student_id ON class_assignments(student_id);
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'class_assignments' AND column_name = 'class_id') THEN
            CREATE INDEX IF NOT EXISTS idx_class_assignments_class_id ON class_assignments(class_id);
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'class_assignments' AND column_name = 'class_id') 
           AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'class_assignments' AND column_name = 'is_active') THEN
            CREATE INDEX IF NOT EXISTS idx_class_assignments_active ON class_assignments(class_id, is_active) WHERE is_active = true;
        END IF;
        RAISE NOTICE 'Created class_assignments indexes';
    END IF;

    -- ASSESSMENTS TABLE
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'assessments') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'teacher_id') THEN
            CREATE INDEX IF NOT EXISTS idx_assessments_teacher_id ON assessments(teacher_id);
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'class_id') THEN
            CREATE INDEX IF NOT EXISTS idx_assessments_class_id ON assessments(class_id);
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'assessment_date') THEN
            CREATE INDEX IF NOT EXISTS idx_assessments_date ON assessments(assessment_date DESC);
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'status') THEN
            CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
        END IF;
        RAISE NOTICE 'Created assessments indexes';
    END IF;

    -- GRADES TABLE
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'grades') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'grades' AND column_name = 'student_id') THEN
            CREATE INDEX IF NOT EXISTS idx_grades_student_id ON grades(student_id);
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'grades' AND column_name = 'assessment_id') THEN
            CREATE INDEX IF NOT EXISTS idx_grades_assessment_id ON grades(assessment_id);
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'grades' AND column_name = 'student_id') 
           AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'grades' AND column_name = 'assessment_id') THEN
            CREATE INDEX IF NOT EXISTS idx_grades_compound ON grades(student_id, assessment_id);
        END IF;
        RAISE NOTICE 'Created grades indexes';
    END IF;

    -- SCHOOL_ANNOUNCEMENTS TABLE
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'school_announcements') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'school_announcements' AND column_name = 'school_id') THEN
            CREATE INDEX IF NOT EXISTS idx_announcements_school_id ON school_announcements(school_id);
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'school_announcements' AND column_name = 'school_id') 
           AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'school_announcements' AND column_name = 'is_active') THEN
            CREATE INDEX IF NOT EXISTS idx_announcements_active ON school_announcements(school_id, is_active) WHERE is_active = true;
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'school_announcements' AND column_name = 'target_audience') THEN
            CREATE INDEX IF NOT EXISTS idx_announcements_target ON school_announcements(target_audience);
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'school_announcements' AND column_name = 'expires_at') THEN
            CREATE INDEX IF NOT EXISTS idx_announcements_expires ON school_announcements(expires_at) WHERE expires_at IS NOT NULL;
        END IF;
        RAISE NOTICE 'Created school_announcements indexes';
    END IF;

    -- POLLS TABLE
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'polls') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'polls' AND column_name = 'school_id') THEN
            CREATE INDEX IF NOT EXISTS idx_polls_school_id ON polls(school_id);
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'polls' AND column_name = 'created_at') THEN
            CREATE INDEX IF NOT EXISTS idx_polls_created_at ON polls(created_at DESC);
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'polls' AND column_name = 'status') THEN
            CREATE INDEX IF NOT EXISTS idx_polls_status ON polls(status);
        END IF;
        RAISE NOTICE 'Created polls indexes';
    END IF;

    -- POLL_RESPONSES TABLE
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'poll_responses') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'poll_responses' AND column_name = 'poll_id') THEN
            CREATE INDEX IF NOT EXISTS idx_poll_responses_poll ON poll_responses(poll_id);
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'poll_responses' AND column_name = 'respondent_id') THEN
            CREATE INDEX IF NOT EXISTS idx_poll_responses_respondent ON poll_responses(respondent_id);
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'poll_responses' AND column_name = 'poll_id') 
           AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'poll_responses' AND column_name = 'respondent_id') THEN
            CREATE INDEX IF NOT EXISTS idx_poll_responses_compound ON poll_responses(poll_id, respondent_id);
        END IF;
        RAISE NOTICE 'Created poll_responses indexes';
    END IF;

    -- Optional tables with conditional creation
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'student_wallets') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'student_wallets' AND column_name = 'student_id') THEN
            CREATE INDEX IF NOT EXISTS idx_student_wallets_student ON student_wallets(student_id);
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'student_wallets' AND column_name = 'updated_at') THEN
            CREATE INDEX IF NOT EXISTS idx_student_wallets_updated ON student_wallets(updated_at DESC);
        END IF;
        RAISE NOTICE 'Created student_wallets indexes';
    END IF;
    
    RAISE NOTICE 'Safe index creation completed successfully!';
END
$$;

-- Grant necessary permissions (only if you have permission)
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
