-- =====================================================
-- Catalyst Wells - Complete Removal of Deprecated Features
-- =====================================================
-- This script removes ALL tables for deprecated features:
-- - Grade Analytics
-- - Digital Portfolio
-- - Achievement Center
-- - School Events Hub
--
-- Run this in Supabase SQL Editor
-- IMPORTANT: This action is irreversible. Backup data first!
--
-- Alternatively, run individual migration files:
-- 1. remove_grade_analytics_tables.sql
-- 2. remove_digital_portfolio_tables.sql
-- 3. remove_achievement_tables.sql
-- 4. remove_school_events_tables.sql
-- =====================================================

BEGIN;

-- Display warning
DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'STARTING REMOVAL OF DEPRECATED FEATURES';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'This will permanently delete:';
  RAISE NOTICE '- Achievement Center tables';
  RAISE NOTICE '- School Events Hub tables';
  RAISE NOTICE '- Digital Portfolio tables';
  RAISE NOTICE '- Grade Analytics tables';
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- 1. REMOVE ACHIEVEMENT TABLES
-- =====================================================
DO $$ 
BEGIN
  RAISE NOTICE 'Removing Achievement Center tables...';
END $$;

DROP TABLE IF EXISTS student_achievements CASCADE;
DROP TABLE IF EXISTS student_achievement_stats CASCADE;
DROP TABLE IF EXISTS achievement_templates CASCADE;
DROP TABLE IF EXISTS achievement_milestones CASCADE;
DROP FUNCTION IF EXISTS update_achievement_stats() CASCADE;

-- =====================================================
-- 2. REMOVE SCHOOL EVENTS TABLES
-- =====================================================
DO $$ 
BEGIN
  RAISE NOTICE 'Removing School Events Hub tables...';
END $$;

DROP TABLE IF EXISTS event_registrations CASCADE;
DROP TABLE IF EXISTS event_participants CASCADE;
DROP TABLE IF EXISTS event_attendance CASCADE;
DROP TABLE IF EXISTS school_events CASCADE;
DROP TABLE IF EXISTS event_categories CASCADE;
DROP FUNCTION IF EXISTS update_event_registration_count() CASCADE;
DROP FUNCTION IF EXISTS check_event_capacity() CASCADE;
DROP VIEW IF EXISTS active_school_events CASCADE;
DROP VIEW IF EXISTS upcoming_events CASCADE;

-- =====================================================
-- 3. REMOVE DIGITAL PORTFOLIO TABLES
-- =====================================================
DO $$ 
BEGIN
  RAISE NOTICE 'Removing Digital Portfolio tables...';
END $$;

DROP TABLE IF EXISTS portfolio_comments CASCADE;
DROP TABLE IF EXISTS portfolio_reactions CASCADE;
DROP TABLE IF EXISTS portfolio_likes CASCADE;
DROP TABLE IF EXISTS portfolio_item_tags CASCADE;
DROP TABLE IF EXISTS portfolio_items CASCADE;
DROP TABLE IF EXISTS portfolio_works CASCADE;
DROP TABLE IF EXISTS student_portfolio_items CASCADE;
DROP TABLE IF EXISTS portfolio_collections CASCADE;
DROP TABLE IF EXISTS portfolio_albums CASCADE;
DROP TABLE IF EXISTS portfolio_categories CASCADE;
DROP TABLE IF EXISTS portfolio_tags CASCADE;
DROP TABLE IF EXISTS student_portfolios CASCADE;
DROP TABLE IF EXISTS digital_portfolios CASCADE;
DROP FUNCTION IF EXISTS update_portfolio_view_count() CASCADE;
DROP FUNCTION IF EXISTS update_portfolio_like_count() CASCADE;
DROP VIEW IF EXISTS public_portfolio_items CASCADE;
DROP VIEW IF EXISTS portfolio_statistics CASCADE;

-- =====================================================
-- 4. REMOVE GRADE ANALYTICS TABLES
-- =====================================================
DO $$ 
BEGIN
  RAISE NOTICE 'Removing Grade Analytics tables...';
END $$;

DROP TABLE IF EXISTS student_performance_analytics CASCADE;
DROP TABLE IF EXISTS grade_analytics CASCADE;
DROP TABLE IF EXISTS subject_performance_analytics CASCADE;
DROP TABLE IF EXISTS subject_analytics CASCADE;
DROP TABLE IF EXISTS grade_trends CASCADE;
DROP TABLE IF EXISTS performance_trends CASCADE;
DROP TABLE IF EXISTS grade_history_analytics CASCADE;
DROP TABLE IF EXISTS class_performance_benchmarks CASCADE;
DROP TABLE IF EXISTS grade_benchmarks CASCADE;
DROP TABLE IF EXISTS grade_predictions CASCADE;
DROP TABLE IF EXISTS performance_predictions CASCADE;
DROP TABLE IF EXISTS analytics_snapshots CASCADE;
DROP TABLE IF EXISTS performance_snapshots CASCADE;
DROP FUNCTION IF EXISTS calculate_grade_analytics() CASCADE;
DROP FUNCTION IF EXISTS update_performance_metrics() CASCADE;
DROP FUNCTION IF EXISTS calculate_gpa() CASCADE;
DROP VIEW IF EXISTS student_grade_summary CASCADE;
DROP VIEW IF EXISTS grade_analytics_view CASCADE;
DROP VIEW IF EXISTS performance_dashboard CASCADE;
DROP MATERIALIZED VIEW IF EXISTS grade_analytics_mv CASCADE;

-- =====================================================
-- COMPLETION SUMMARY
-- =====================================================
DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CLEANUP COMPLETED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'All deprecated feature tables removed';
  RAISE NOTICE 'Total tables dropped: ~30+';
  RAISE NOTICE 'Total functions dropped: ~8+';
  RAISE NOTICE 'Total views dropped: ~6+';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Delete corresponding page folders';
  RAISE NOTICE '2. Delete API route folders';
  RAISE NOTICE '3. Remove navigation links';
  RAISE NOTICE '========================================';
END $$;

COMMIT;
