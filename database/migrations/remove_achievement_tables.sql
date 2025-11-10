-- =====================================================
-- Catalyst Wells - Remove Achievement System Tables
-- =====================================================
-- This script removes all tables related to the Achievement Center feature
-- Run this in Supabase SQL Editor
-- IMPORTANT: This action is irreversible. Backup data if needed.

-- Drop tables in correct order (children first, then parents)
-- Based on API routes: /api/achievements and /api/v2/student/achievements

-- 1. Drop student achievements table (contains individual student achievement records)
DROP TABLE IF EXISTS student_achievements CASCADE;

-- 2. Drop student achievement stats table (aggregated statistics)
DROP TABLE IF EXISTS student_achievement_stats CASCADE;

-- 3. Drop achievement templates table (achievement definitions)
DROP TABLE IF EXISTS achievement_templates CASCADE;

-- 4. Drop achievement milestones table (referenced in /api/achievements/milestones)
DROP TABLE IF EXISTS achievement_milestones CASCADE;

-- 5. Drop any related functions or triggers
DROP FUNCTION IF EXISTS update_achievement_stats() CASCADE;
DROP TRIGGER IF EXISTS achievement_stats_trigger ON student_achievements;

-- 6. Drop any RLS policies (automatically dropped with CASCADE)
-- No additional commands needed

-- Verify cleanup
DO $$ 
BEGIN
  RAISE NOTICE 'Achievement tables removed successfully';
  RAISE NOTICE 'Tables dropped: student_achievements, student_achievement_stats, achievement_templates, achievement_milestones';
END $$;
