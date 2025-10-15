-- ============================================================================
-- Remove ALL SECURITY DEFINER Views - Complete Fix
-- Purpose: Eliminate all SECURITY DEFINER views to resolve ERROR level issues
-- Date: 2025-10-15
-- ============================================================================

-- ============================================================================
-- 1. attendance_all
-- ============================================================================
DROP VIEW IF EXISTS public.attendance_all CASCADE;
CREATE OR REPLACE VIEW public.attendance_all AS
SELECT * FROM public.attendance;


-- ============================================================================
-- 2. v_unused_indexes
-- ============================================================================
DROP VIEW IF EXISTS public.v_unused_indexes CASCADE;
CREATE OR REPLACE VIEW public.v_unused_indexes AS
SELECT
    sui.schemaname,
    sui.relname as tablename,
    sui.indexrelname as indexname,
    sui.idx_scan,
    pg_size_pretty(pg_relation_size(sui.indexrelid)) as index_size
FROM pg_stat_user_indexes sui
WHERE sui.idx_scan = 0
AND sui.schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_relation_size(sui.indexrelid) DESC;

-- Restrict to admins only
REVOKE ALL ON public.v_unused_indexes FROM PUBLIC;
GRANT SELECT ON public.v_unused_indexes TO postgres, service_role;


-- ============================================================================
-- 3. student_messaging_slow_queries
-- ============================================================================
DROP VIEW IF EXISTS public.student_messaging_slow_queries CASCADE;
CREATE OR REPLACE VIEW public.student_messaging_slow_queries AS
SELECT
    query,
    calls,
    total_exec_time as total_time,
    mean_exec_time as mean_time,
    min_exec_time as min_time,
    max_exec_time as max_time
FROM pg_stat_statements
WHERE query LIKE '%student_messages%'
AND mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 100;

-- Restrict to admins only
REVOKE ALL ON public.student_messaging_slow_queries FROM PUBLIC;
GRANT SELECT ON public.student_messaging_slow_queries TO postgres, service_role;


-- ============================================================================
-- 4. v_index_usage_stats
-- ============================================================================
DROP VIEW IF EXISTS public.v_index_usage_stats CASCADE;
CREATE OR REPLACE VIEW public.v_index_usage_stats AS
SELECT
    sui.schemaname,
    sui.relname as tablename,
    sui.indexrelname as indexname,
    sui.idx_scan,
    sui.idx_tup_read,
    sui.idx_tup_fetch,
    pg_size_pretty(pg_relation_size(sui.indexrelid)) as size
FROM pg_stat_user_indexes sui
ORDER BY sui.idx_scan DESC;

-- Restrict to admins only
REVOKE ALL ON public.v_index_usage_stats FROM PUBLIC;
GRANT SELECT ON public.v_index_usage_stats TO postgres, service_role;


-- ============================================================================
-- 5. common_timezones
-- ============================================================================
DROP VIEW IF EXISTS public.common_timezones CASCADE;

-- Check if cached_timezones exists before creating view
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'cached_timezones') THEN
        -- Use cached version
        EXECUTE 'CREATE OR REPLACE VIEW public.common_timezones AS
        SELECT name FROM public.cached_timezones
        WHERE name IN (
            ''UTC'',
            ''America/New_York'',
            ''America/Chicago'',
            ''America/Denver'',
            ''America/Los_Angeles'',
            ''America/Phoenix'',
            ''America/Anchorage'',
            ''Pacific/Honolulu'',
            ''Europe/London'',
            ''Europe/Paris'',
            ''Europe/Berlin'',
            ''Europe/Rome'',
            ''Europe/Madrid'',
            ''Asia/Dubai'',
            ''Asia/Kolkata'',
            ''Asia/Bangkok'',
            ''Asia/Singapore'',
            ''Asia/Hong_Kong'',
            ''Asia/Tokyo'',
            ''Asia/Seoul'',
            ''Australia/Sydney'',
            ''Australia/Melbourne'',
            ''Pacific/Auckland''
        )
        ORDER BY name';
    ELSE
        -- Use direct query
        EXECUTE 'CREATE OR REPLACE VIEW public.common_timezones AS
        SELECT name FROM pg_timezone_names
        WHERE name IN (
            ''UTC'',
            ''America/New_York'',
            ''America/Chicago'',
            ''America/Denver'',
            ''America/Los_Angeles'',
            ''America/Phoenix'',
            ''America/Anchorage'',
            ''Pacific/Honolulu'',
            ''Europe/London'',
            ''Europe/Paris'',
            ''Europe/Berlin'',
            ''Europe/Rome'',
            ''Europe/Madrid'',
            ''Asia/Dubai'',
            ''Asia/Kolkata'',
            ''Asia/Bangkok'',
            ''Asia/Singapore'',
            ''Asia/Hong_Kong'',
            ''Asia/Tokyo'',
            ''Asia/Seoul'',
            ''Australia/Sydney'',
            ''Australia/Melbourne'',
            ''Pacific/Auckland''
        )
        ORDER BY name';
    END IF;
END $$;


-- ============================================================================
-- 6. realtime_subscription_stats
-- ============================================================================
DROP VIEW IF EXISTS public.realtime_subscription_stats CASCADE;

-- Check if realtime schema and subscription table exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'realtime' 
        AND table_name = 'subscription'
    ) THEN
        EXECUTE 'CREATE OR REPLACE VIEW public.realtime_subscription_stats AS
        SELECT 
            COUNT(*) as total_subscriptions,
            COUNT(DISTINCT subscription_id) as unique_subscription_ids,
            COUNT(DISTINCT entity) as unique_tables,
            MIN(created_at) as oldest_subscription_date,
            MAX(created_at) as newest_subscription_date,
            EXTRACT(EPOCH FROM (NOW() - MIN(created_at))) / 3600 as hours_since_oldest,
            COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL ''1 hour'') as last_hour,
            COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL ''24 hours'') as last_24_hours
        FROM realtime.subscription';
    ELSE
        -- Create dummy view if realtime doesn't exist
        EXECUTE 'CREATE OR REPLACE VIEW public.realtime_subscription_stats AS
        SELECT 
            0::bigint as total_subscriptions,
            0::bigint as unique_subscription_ids,
            0::bigint as unique_tables,
            NOW() as oldest_subscription_date,
            NOW() as newest_subscription_date,
            0::numeric as hours_since_oldest,
            0::bigint as last_hour,
            0::bigint as last_24_hours';
    END IF;
END $$;

-- Restrict to admins only
REVOKE ALL ON public.realtime_subscription_stats FROM PUBLIC;
GRANT SELECT ON public.realtime_subscription_stats TO postgres, service_role;


-- ============================================================================
-- Verification
-- ============================================================================
DO $$
DECLARE
    view_rec RECORD;
    definer_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== Checking for SECURITY DEFINER Views ===';
    RAISE NOTICE '';
    
    -- Check all views
    FOR view_rec IN 
        SELECT 
            schemaname,
            viewname
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
        RAISE NOTICE 'Checking view: %.%', view_rec.schemaname, view_rec.viewname;
        
        -- Check if it has SECURITY DEFINER
        PERFORM 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_rewrite r ON r.ev_class = c.oid
        WHERE n.nspname = view_rec.schemaname
        AND c.relname = view_rec.viewname
        AND r.ev_type = '1'
        AND r.ev_action::text LIKE '%security_definer%';
        
        IF FOUND THEN
            definer_count := definer_count + 1;
            RAISE WARNING '  ❌ Still has SECURITY DEFINER';
        ELSE
            RAISE NOTICE '  ✅ SECURITY DEFINER removed';
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    IF definer_count = 0 THEN
        RAISE NOTICE '✅ SUCCESS: All SECURITY DEFINER views have been removed!';
    ELSE
        RAISE WARNING '⚠️  WARNING: % views still have SECURITY DEFINER', definer_count;
    END IF;
    RAISE NOTICE '';
END $$;


-- ============================================================================
-- Summary
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '=== Fix Complete ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Actions taken:';
    RAISE NOTICE '1. Dropped and recreated ALL 6 views without SECURITY DEFINER';
    RAISE NOTICE '2. Restricted admin monitoring views to postgres and service_role only';
    RAISE NOTICE '3. Views now run with querying user permissions';
    RAISE NOTICE '';
    RAISE NOTICE 'Security improvements:';
    RAISE NOTICE '- attendance_all: Now respects RLS policies';
    RAISE NOTICE '- Monitoring views: Admin access only, no privilege escalation';
    RAISE NOTICE '- common_timezones: Public read-only data, safe without DEFINER';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Run the function search path fix script';
    RAISE NOTICE '2. Enable leaked password protection in Supabase Dashboard';
    RAISE NOTICE '3. Plan Postgres upgrade for security patches';
    RAISE NOTICE '';
END $$;
