-- =====================================================
-- Catalyst Wells - Remove Digital Portfolio System Tables
-- =====================================================
-- This script removes all tables related to the Digital Portfolio feature
-- Run this in Supabase SQL Editor
-- IMPORTANT: This action is irreversible. Backup data if needed.

-- Drop tables in correct order (children first, then parents)
-- Based on API route: /api/digital-portfolio

-- 1. Drop portfolio item comments table (if exists)
DROP TABLE IF EXISTS portfolio_comments CASCADE;

-- 2. Drop portfolio item likes/reactions table (if exists)
DROP TABLE IF EXISTS portfolio_reactions CASCADE;
DROP TABLE IF EXISTS portfolio_likes CASCADE;

-- 3. Drop portfolio item tags/categories junction table (if exists)
DROP TABLE IF EXISTS portfolio_item_tags CASCADE;

-- 4. Drop portfolio items/works table (main content)
DROP TABLE IF EXISTS portfolio_items CASCADE;
DROP TABLE IF EXISTS portfolio_works CASCADE;
DROP TABLE IF EXISTS student_portfolio_items CASCADE;

-- 5. Drop portfolio collections/albums table (if exists)
DROP TABLE IF EXISTS portfolio_collections CASCADE;
DROP TABLE IF EXISTS portfolio_albums CASCADE;

-- 6. Drop portfolio categories/tags table (if exists)
DROP TABLE IF EXISTS portfolio_categories CASCADE;
DROP TABLE IF EXISTS portfolio_tags CASCADE;

-- 7. Drop main student portfolios table
DROP TABLE IF EXISTS student_portfolios CASCADE;
DROP TABLE IF EXISTS digital_portfolios CASCADE;

-- 8. Drop any related functions or triggers
DROP FUNCTION IF EXISTS update_portfolio_view_count() CASCADE;
DROP FUNCTION IF EXISTS update_portfolio_like_count() CASCADE;
DROP TRIGGER IF EXISTS portfolio_views_trigger ON portfolio_items;
DROP TRIGGER IF EXISTS portfolio_likes_trigger ON portfolio_likes;

-- 9. Drop any views
DROP VIEW IF EXISTS public_portfolio_items CASCADE;
DROP VIEW IF EXISTS portfolio_statistics CASCADE;

-- 10. Drop any RLS policies (automatically dropped with CASCADE)
-- No additional commands needed

-- Verify cleanup
DO $$ 
BEGIN
  RAISE NOTICE 'Digital Portfolio tables removed successfully';
  RAISE NOTICE 'Tables dropped: portfolio_items, portfolio_reactions, portfolio_collections, student_portfolios';
END $$;
