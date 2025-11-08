-- ============================================
-- Quick Check: Verify Seating Chart Tables
-- ============================================
-- Run this in Supabase SQL Editor to verify installation

-- Check if tables exist
SELECT 
    tablename,
    schemaname
FROM pg_tables
WHERE tablename IN ('seating_charts', 'seat_assignments', 'seating_chart_history', 'seating_preferences', 'seating_analytics')
AND schemaname = 'public'
ORDER BY tablename;

-- Check RLS status
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('seating_charts', 'seat_assignments')
AND schemaname = 'public';

-- Check if policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename IN ('seating_charts', 'seat_assignments')
ORDER BY tablename, policyname;

-- Count existing records (if tables exist)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'seating_charts' AND schemaname = 'public') THEN
        RAISE NOTICE 'Seating Charts Count: %', (SELECT COUNT(*) FROM seating_charts);
        RAISE NOTICE 'Seat Assignments Count: %', (SELECT COUNT(*) FROM seat_assignments);
    ELSE
        RAISE NOTICE 'Tables do not exist. Please run seating_chart_schema.sql first.';
    END IF;
END $$;
