-- PREMIUM FEATURES COMPLETE DATABASE SCHEMA
-- This script creates all tables for the premium features in the correct order
-- Run this script in your Supabase database to set up all premium functionality

-- =============================================================================
-- IMPORTANT: Run these commands in your Supabase SQL Editor
-- =============================================================================

-- First, ensure the update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================================================
-- 1. STUDY GROUPS SCHEMA
-- =============================================================================
\i study_groups_schema.sql

-- =============================================================================
-- 2. PEER TUTORING SCHEMA  
-- =============================================================================
\i peer_tutoring_schema.sql

-- =============================================================================
-- 3. SCHOOL EVENTS HUB SCHEMA
-- =============================================================================
\i school_events_schema.sql

-- =============================================================================
-- 4. ACHIEVEMENT CENTER SCHEMA
-- =============================================================================
\i achievement_center_schema.sql

-- =============================================================================
-- 5. LEARNING GAMES SCHEMA
-- =============================================================================
\i learning_games_schema.sql

-- =============================================================================
-- 6. DIGITAL PORTFOLIO SCHEMA
-- =============================================================================
\i digital_portfolio_schema.sql

-- =============================================================================
-- 7. PROJECT SHOWCASE SCHEMA
-- =============================================================================
\i project_showcase_schema.sql

-- =============================================================================
-- FINAL SETUP AND VERIFICATION
-- =============================================================================

-- Create indexes for cross-feature performance
CREATE INDEX IF NOT EXISTS idx_profiles_school_role ON profiles(school_id, role);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- Verify all tables were created successfully
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'study_groups', 'tutor_profiles', 'school_events', 'achievements', 
        'learning_games', 'student_portfolios', 'student_projects'
    );
    
    IF table_count = 7 THEN
        RAISE NOTICE 'SUCCESS: All 7 premium feature schemas created successfully!';
        RAISE NOTICE 'Premium features ready: Study Groups, Peer Tutoring, School Events, Achievement Center, Learning Games, Digital Portfolio, Project Showcase';
    ELSE
        RAISE NOTICE 'WARNING: Only % out of 7 main tables created. Please check for errors.', table_count;
    END IF;
END $$;
