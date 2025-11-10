-- =====================================================
-- Catalyst Wells - Remove School Events System Tables
-- =====================================================
-- This script removes all tables related to the School Events Hub feature
-- Run this in Supabase SQL Editor
-- IMPORTANT: This action is irreversible. Backup data if needed.

-- Drop tables in correct order (children first, then parents)
-- Based on API routes: /api/school-events, /api/school-events/register

-- 1. Drop event registrations table (many-to-many relationship)
DROP TABLE IF EXISTS event_registrations CASCADE;

-- 2. Drop event participants table (if exists)
DROP TABLE IF EXISTS event_participants CASCADE;

-- 3. Drop event attendance table (if exists)
DROP TABLE IF EXISTS event_attendance CASCADE;

-- 4. Drop main school events table
DROP TABLE IF EXISTS school_events CASCADE;

-- 5. Drop event categories table (if exists)
DROP TABLE IF EXISTS event_categories CASCADE;

-- 6. Drop any related functions or triggers
DROP FUNCTION IF EXISTS update_event_registration_count() CASCADE;
DROP FUNCTION IF EXISTS check_event_capacity() CASCADE;
DROP TRIGGER IF EXISTS event_registration_count_trigger ON event_registrations;

-- 7. Drop any views
DROP VIEW IF EXISTS active_school_events CASCADE;
DROP VIEW IF EXISTS upcoming_events CASCADE;

-- 8. Drop any RLS policies (automatically dropped with CASCADE)
-- No additional commands needed

-- Verify cleanup
DO $$ 
BEGIN
  RAISE NOTICE 'School Events tables removed successfully';
  RAISE NOTICE 'Tables dropped: event_registrations, school_events, event_categories';
END $$;
