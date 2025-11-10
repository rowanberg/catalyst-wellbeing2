-- =====================================================
-- Catalyst Wells - Safe Feature Removal with Verification
-- =====================================================
-- This script safely removes deprecated features
-- Only drops tables that actually exist
-- Run this in Supabase SQL Editor
-- =====================================================

DO $$
DECLARE
  table_count INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFYING DEPRECATED FEATURE TABLES';
  RAISE NOTICE '========================================';

  -- Check Achievement tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('student_achievements', 'achievement_templates', 'achievement_milestones', 'student_achievement_stats');
  
  IF table_count > 0 THEN
    RAISE NOTICE 'Found % achievement tables - will remove', table_count;
  ELSE
    RAISE NOTICE 'No achievement tables found - skipping';
  END IF;

  -- Check School Events tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('school_events', 'event_registrations', 'event_participants', 'event_attendance', 'event_categories');
  
  IF table_count > 0 THEN
    RAISE NOTICE 'Found % school events tables - will remove', table_count;
  ELSE
    RAISE NOTICE 'No school events tables found - skipping';
  END IF;

  -- Check Portfolio tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name LIKE '%portfolio%';
  
  IF table_count > 0 THEN
    RAISE NOTICE 'Found % portfolio tables - will remove', table_count;
  ELSE
    RAISE NOTICE 'No portfolio tables found - skipping';
  END IF;

  -- Check Analytics tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND (table_name LIKE '%grade_analytics%' OR table_name LIKE '%performance%analytics%');
  
  IF table_count > 0 THEN
    RAISE NOTICE 'Found % analytics tables - will remove', table_count;
  ELSE
    RAISE NOTICE 'No analytics tables found - skipping';
  END IF;

  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- SAFE REMOVAL - Only drops existing tables
-- =====================================================

-- Achievement Tables (only if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_achievements') THEN
    DROP TABLE student_achievements CASCADE;
    RAISE NOTICE '✓ Dropped: student_achievements';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_achievement_stats') THEN
    DROP TABLE student_achievement_stats CASCADE;
    RAISE NOTICE '✓ Dropped: student_achievement_stats';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'achievement_templates') THEN
    DROP TABLE achievement_templates CASCADE;
    RAISE NOTICE '✓ Dropped: achievement_templates';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'achievement_milestones') THEN
    DROP TABLE achievement_milestones CASCADE;
    RAISE NOTICE '✓ Dropped: achievement_milestones';
  END IF;
END $$;

-- School Events Tables (only if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_registrations') THEN
    DROP TABLE event_registrations CASCADE;
    RAISE NOTICE '✓ Dropped: event_registrations';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_participants') THEN
    DROP TABLE event_participants CASCADE;
    RAISE NOTICE '✓ Dropped: event_participants';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_attendance') THEN
    DROP TABLE event_attendance CASCADE;
    RAISE NOTICE '✓ Dropped: event_attendance';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'school_events') THEN
    DROP TABLE school_events CASCADE;
    RAISE NOTICE '✓ Dropped: school_events';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_categories') THEN
    DROP TABLE event_categories CASCADE;
    RAISE NOTICE '✓ Dropped: event_categories';
  END IF;
END $$;

-- Digital Portfolio Tables (only if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'portfolio_comments') THEN
    DROP TABLE portfolio_comments CASCADE;
    RAISE NOTICE '✓ Dropped: portfolio_comments';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'portfolio_reactions') THEN
    DROP TABLE portfolio_reactions CASCADE;
    RAISE NOTICE '✓ Dropped: portfolio_reactions';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'portfolio_likes') THEN
    DROP TABLE portfolio_likes CASCADE;
    RAISE NOTICE '✓ Dropped: portfolio_likes';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'portfolio_item_tags') THEN
    DROP TABLE portfolio_item_tags CASCADE;
    RAISE NOTICE '✓ Dropped: portfolio_item_tags';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'portfolio_items') THEN
    DROP TABLE portfolio_items CASCADE;
    RAISE NOTICE '✓ Dropped: portfolio_items';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'portfolio_works') THEN
    DROP TABLE portfolio_works CASCADE;
    RAISE NOTICE '✓ Dropped: portfolio_works';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_portfolio_items') THEN
    DROP TABLE student_portfolio_items CASCADE;
    RAISE NOTICE '✓ Dropped: student_portfolio_items';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'portfolio_collections') THEN
    DROP TABLE portfolio_collections CASCADE;
    RAISE NOTICE '✓ Dropped: portfolio_collections';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'portfolio_albums') THEN
    DROP TABLE portfolio_albums CASCADE;
    RAISE NOTICE '✓ Dropped: portfolio_albums';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'portfolio_categories') THEN
    DROP TABLE portfolio_categories CASCADE;
    RAISE NOTICE '✓ Dropped: portfolio_categories';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'portfolio_tags') THEN
    DROP TABLE portfolio_tags CASCADE;
    RAISE NOTICE '✓ Dropped: portfolio_tags';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_portfolios') THEN
    DROP TABLE student_portfolios CASCADE;
    RAISE NOTICE '✓ Dropped: student_portfolios';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'digital_portfolios') THEN
    DROP TABLE digital_portfolios CASCADE;
    RAISE NOTICE '✓ Dropped: digital_portfolios';
  END IF;
END $$;

-- Grade Analytics Tables (only if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_performance_analytics') THEN
    DROP TABLE student_performance_analytics CASCADE;
    RAISE NOTICE '✓ Dropped: student_performance_analytics';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'grade_analytics') THEN
    DROP TABLE grade_analytics CASCADE;
    RAISE NOTICE '✓ Dropped: grade_analytics';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subject_performance_analytics') THEN
    DROP TABLE subject_performance_analytics CASCADE;
    RAISE NOTICE '✓ Dropped: subject_performance_analytics';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subject_analytics') THEN
    DROP TABLE subject_analytics CASCADE;
    RAISE NOTICE '✓ Dropped: subject_analytics';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'grade_trends') THEN
    DROP TABLE grade_trends CASCADE;
    RAISE NOTICE '✓ Dropped: grade_trends';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'performance_trends') THEN
    DROP TABLE performance_trends CASCADE;
    RAISE NOTICE '✓ Dropped: performance_trends';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'grade_history_analytics') THEN
    DROP TABLE grade_history_analytics CASCADE;
    RAISE NOTICE '✓ Dropped: grade_history_analytics';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'class_performance_benchmarks') THEN
    DROP TABLE class_performance_benchmarks CASCADE;
    RAISE NOTICE '✓ Dropped: class_performance_benchmarks';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'grade_benchmarks') THEN
    DROP TABLE grade_benchmarks CASCADE;
    RAISE NOTICE '✓ Dropped: grade_benchmarks';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'grade_predictions') THEN
    DROP TABLE grade_predictions CASCADE;
    RAISE NOTICE '✓ Dropped: grade_predictions';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'performance_predictions') THEN
    DROP TABLE performance_predictions CASCADE;
    RAISE NOTICE '✓ Dropped: performance_predictions';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'analytics_snapshots') THEN
    DROP TABLE analytics_snapshots CASCADE;
    RAISE NOTICE '✓ Dropped: analytics_snapshots';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'performance_snapshots') THEN
    DROP TABLE performance_snapshots CASCADE;
    RAISE NOTICE '✓ Dropped: performance_snapshots';
  END IF;
END $$;

-- =====================================================
-- COMPLETION SUMMARY
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CLEANUP COMPLETED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'All existing deprecated tables removed';
  RAISE NOTICE 'Tables that did not exist were skipped';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Delete page folders from file system';
  RAISE NOTICE '2. Delete API route folders';
  RAISE NOTICE '3. Verify no broken links in app';
  RAISE NOTICE '========================================';
END $$;
