-- =====================================================
-- Catalyst Wells - Remove Grade Analytics System Tables
-- =====================================================
-- This script removes all tables related to the Grade Analytics feature
-- Run this in Supabase SQL Editor
-- IMPORTANT: This action is irreversible. Backup data if needed.

-- NOTE: This script only removes analytics-specific tables.
-- Core grade/assessment tables are preserved as they may be used by other features.

-- Drop analytics-specific tables in correct order
-- Based on common analytics patterns

-- 1. Drop student performance analytics table
DROP TABLE IF EXISTS student_performance_analytics CASCADE;
DROP TABLE IF EXISTS grade_analytics CASCADE;

-- 2. Drop subject-wise analytics table
DROP TABLE IF EXISTS subject_performance_analytics CASCADE;
DROP TABLE IF EXISTS subject_analytics CASCADE;

-- 3. Drop grade trends/history table
DROP TABLE IF EXISTS grade_trends CASCADE;
DROP TABLE IF EXISTS performance_trends CASCADE;
DROP TABLE IF EXISTS grade_history_analytics CASCADE;

-- 4. Drop class benchmarks/averages table
DROP TABLE IF EXISTS class_performance_benchmarks CASCADE;
DROP TABLE IF EXISTS grade_benchmarks CASCADE;

-- 5. Drop grade predictions table (if exists)
DROP TABLE IF EXISTS grade_predictions CASCADE;
DROP TABLE IF EXISTS performance_predictions CASCADE;

-- 6. Drop analytics snapshots table (if exists)
DROP TABLE IF EXISTS analytics_snapshots CASCADE;
DROP TABLE IF EXISTS performance_snapshots CASCADE;

-- 7. Drop any related functions or triggers
DROP FUNCTION IF EXISTS calculate_grade_analytics() CASCADE;
DROP FUNCTION IF EXISTS update_performance_metrics() CASCADE;
DROP FUNCTION IF EXISTS calculate_gpa() CASCADE;
DROP TRIGGER IF EXISTS analytics_update_trigger ON grades;

-- 8. Drop any views
DROP VIEW IF EXISTS student_grade_summary CASCADE;
DROP VIEW IF EXISTS grade_analytics_view CASCADE;
DROP VIEW IF EXISTS performance_dashboard CASCADE;

-- 9. Drop any materialized views
DROP MATERIALIZED VIEW IF EXISTS grade_analytics_mv CASCADE;

-- 10. Drop any RLS policies (automatically dropped with CASCADE)
-- No additional commands needed

-- Verify cleanup
DO $$ 
BEGIN
  RAISE NOTICE 'Grade Analytics tables removed successfully';
  RAISE NOTICE 'Tables dropped: grade_analytics, performance_trends, grade_benchmarks, grade_predictions';
  RAISE NOTICE 'NOTE: Core grades/assessments tables preserved for other features';
END $$;
