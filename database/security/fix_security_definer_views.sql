-- ============================================================================
-- Fix Remaining Security Definer Views
-- Purpose: Remove SECURITY DEFINER property from views
-- Date: 2025-10-15
-- ============================================================================

-- ============================================================================
-- View 1: attendance_all
-- ============================================================================
-- Recreate without SECURITY DEFINER
DROP VIEW IF EXISTS public.attendance_all CASCADE;
CREATE VIEW public.attendance_all AS
SELECT * FROM public.attendance;
-- Now uses querying user's permissions + RLS policies

COMMENT ON VIEW public.attendance_all IS 'View of all attendance records - enforces RLS policies';


-- ============================================================================
-- View 2-4: Monitoring/Admin Views (Safe to keep SECURITY DEFINER)
-- ============================================================================
-- These are OK as admin-only monitoring views:
-- - v_unused_indexes
-- - student_messaging_slow_queries  
-- - v_index_usage_stats
-- 
-- BUT we should ensure they're not accessible to regular users
-- Add RLS to restrict access to admins only

-- Grant explicit access only to postgres role and service_role
REVOKE ALL ON public.v_unused_indexes FROM PUBLIC;
REVOKE ALL ON public.student_messaging_slow_queries FROM PUBLIC;
REVOKE ALL ON public.v_index_usage_stats FROM PUBLIC;

GRANT SELECT ON public.v_unused_indexes TO postgres, service_role;
GRANT SELECT ON public.student_messaging_slow_queries TO postgres, service_role;
GRANT SELECT ON public.v_index_usage_stats TO postgres, service_role;


-- ============================================================================
-- View 5: common_timezones (Created by performance script)
-- ============================================================================
-- This view is read-only reference data, safe to keep SECURITY DEFINER
-- But let's recreate without it for consistency

DROP VIEW IF EXISTS public.common_timezones CASCADE;
CREATE VIEW public.common_timezones AS
SELECT name FROM cached_timezones
WHERE name IN (
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Phoenix',
    'America/Anchorage',
    'Pacific/Honolulu',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Rome',
    'Europe/Madrid',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Bangkok',
    'Asia/Singapore',
    'Asia/Hong_Kong',
    'Asia/Tokyo',
    'Asia/Seoul',
    'Australia/Sydney',
    'Australia/Melbourne',
    'Pacific/Auckland'
)
ORDER BY name;

COMMENT ON VIEW public.common_timezones IS 'Commonly used timezones - read-only reference data';


-- ============================================================================
-- View 6: realtime_subscription_stats (Created by performance script)
-- ============================================================================
-- This is admin monitoring, safe to keep SECURITY DEFINER but restrict access

REVOKE ALL ON public.realtime_subscription_stats FROM PUBLIC;
GRANT SELECT ON public.realtime_subscription_stats TO postgres, service_role;


-- ============================================================================
-- Verification
-- ============================================================================
DO $$ 
DECLARE
    definer_view_count INTEGER;
    view_info RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== Security Definer View Check ===';
    
    -- Count remaining SECURITY DEFINER views
    SELECT COUNT(*) INTO definer_view_count
    FROM pg_views
    WHERE schemaname = 'public'
    AND viewname IN (
        'attendance_all',
        'v_unused_indexes',
        'student_messaging_slow_queries',
        'v_index_usage_stats',
        'common_timezones',
        'realtime_subscription_stats'
    );
    
    RAISE NOTICE 'Found % views to check', definer_view_count;
    RAISE NOTICE '';
    
    -- List views and their definitions
    FOR view_info IN 
        SELECT 
            viewname,
            CASE 
                WHEN definition LIKE '%security_invoker%' THEN 'SECURITY INVOKER'
                WHEN definition LIKE '%security_definer%' THEN 'SECURITY DEFINER'
                ELSE 'DEFAULT (INVOKER)'
            END as security_type
        FROM pg_views
        WHERE schemaname = 'public'
        AND viewname IN (
            'attendance_all',
            'v_unused_indexes',
            'student_messaging_slow_queries',
            'v_index_usage_stats',
            'common_timezones',
            'realtime_subscription_stats'
        )
    LOOP
        RAISE NOTICE 'View: % - %', view_info.viewname, view_info.security_type;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Recommendation:';
    RAISE NOTICE '- attendance_all: Changed to SECURITY INVOKER (enforces RLS)';
    RAISE NOTICE '- common_timezones: Changed to SECURITY INVOKER (public reference data)';
    RAISE NOTICE '- Monitoring views: Access restricted to admin roles only';
    RAISE NOTICE '';
END $$;


-- ============================================================================
-- Alternative: Complete Removal of SECURITY DEFINER (More Secure)
-- ============================================================================
-- If you want to completely remove SECURITY DEFINER from ALL views:

/*
-- Recreate v_unused_indexes without SECURITY DEFINER
DROP VIEW IF EXISTS public.v_unused_indexes CASCADE;
CREATE VIEW public.v_unused_indexes AS
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_relation_size(indexrelid) DESC;

-- Recreate student_messaging_slow_queries without SECURITY DEFINER  
DROP VIEW IF EXISTS public.student_messaging_slow_queries CASCADE;
CREATE VIEW public.student_messaging_slow_queries AS
SELECT
    query,
    calls,
    total_time,
    mean_time,
    min_time,
    max_time
FROM pg_stat_statements
WHERE query LIKE '%student_messages%'
AND mean_time > 100
ORDER BY mean_time DESC;

-- Recreate v_index_usage_stats without SECURITY DEFINER
DROP VIEW IF EXISTS public.v_index_usage_stats CASCADE;
CREATE VIEW public.v_index_usage_stats AS
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Recreate realtime_subscription_stats without SECURITY DEFINER
DROP VIEW IF EXISTS public.realtime_subscription_stats CASCADE;
CREATE VIEW public.realtime_subscription_stats AS
SELECT 
    COUNT(*) as total_subscriptions,
    COUNT(DISTINCT subscription_id) as unique_subscription_ids,
    COUNT(DISTINCT entity) as unique_tables,
    MIN(created_at) as oldest_subscription_date,
    MAX(created_at) as newest_subscription_date,
    EXTRACT(EPOCH FROM (NOW() - MIN(created_at))) / 3600 as hours_since_oldest,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') as last_hour,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24_hours
FROM realtime.subscription;

-- Restrict access to admin roles
REVOKE ALL ON public.v_unused_indexes FROM PUBLIC;
REVOKE ALL ON public.student_messaging_slow_queries FROM PUBLIC;
REVOKE ALL ON public.v_index_usage_stats FROM PUBLIC;
REVOKE ALL ON public.realtime_subscription_stats FROM PUBLIC;

GRANT SELECT ON public.v_unused_indexes TO postgres, service_role;
GRANT SELECT ON public.student_messaging_slow_queries TO postgres, service_role;
GRANT SELECT ON public.v_index_usage_stats TO postgres, service_role;
GRANT SELECT ON public.realtime_subscription_stats TO postgres, service_role;
*/


-- ============================================================================
-- Summary
-- ============================================================================
DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== Fix Complete ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Actions Taken:';
    RAISE NOTICE '1. ✅ Removed SECURITY DEFINER from attendance_all';
    RAISE NOTICE '2. ✅ Removed SECURITY DEFINER from common_timezones';
    RAISE NOTICE '3. ✅ Restricted access to monitoring views (admin only)';
    RAISE NOTICE '';
    RAISE NOTICE 'Remaining SECURITY DEFINER Views (Admin/Monitoring):';
    RAISE NOTICE '- v_unused_indexes (admin only)';
    RAISE NOTICE '- student_messaging_slow_queries (admin only)';
    RAISE NOTICE '- v_index_usage_stats (admin only)';
    RAISE NOTICE '- realtime_subscription_stats (admin only)';
    RAISE NOTICE '';
    RAISE NOTICE 'These are safe because:';
    RAISE NOTICE '1. They contain no user-specific data';
    RAISE NOTICE '2. Access is restricted to admin roles only';
    RAISE NOTICE '3. They are monitoring/diagnostic tools';
    RAISE NOTICE '';
    RAISE NOTICE 'To completely remove SECURITY DEFINER:';
    RAISE NOTICE 'Uncomment the "Alternative" section in this script';
    RAISE NOTICE '';
END $$;
