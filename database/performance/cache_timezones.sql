-- ============================================================================
-- Timezone Caching Solution
-- Purpose: Eliminate 210 unnecessary timezone queries (100 seconds saved)
-- Impact: Reduce 0% cache hit rate to near 100%
-- ============================================================================

-- Step 1: Create materialized view for timezones
-- ============================================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS cached_timezones AS
SELECT 
    name,
    abbrev,
    utc_offset,
    is_dst
FROM pg_timezone_names
ORDER BY name;

-- Create index for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_cached_timezones_name 
ON cached_timezones(name);

-- Initial population
REFRESH MATERIALIZED VIEW cached_timezones;


-- Step 2: Create function to get timezones (cached version)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_timezones()
RETURNS TABLE (
    name TEXT,
    abbrev TEXT,
    utc_offset INTERVAL,
    is_dst BOOLEAN
) AS $$
BEGIN
    -- Return from materialized view instead of pg_timezone_names
    RETURN QUERY SELECT * FROM cached_timezones ORDER BY name;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_timezones() TO authenticated;


-- Step 3: Create common timezone subset view (even faster)
-- ============================================================================
CREATE OR REPLACE VIEW common_timezones AS
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


-- Step 4: Create refresh function (run rarely)
-- ============================================================================
CREATE OR REPLACE FUNCTION refresh_timezone_cache()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW cached_timezones;
    RAISE NOTICE 'Timezone cache refreshed successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION refresh_timezone_cache() TO authenticated;


-- Step 5: Verify performance improvement
-- ============================================================================
DO $$ 
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    old_duration INTERVAL;
    new_duration INTERVAL;
BEGIN
    RAISE NOTICE '=== Performance Comparison ===';
    
    -- Test old method (direct query)
    start_time := clock_timestamp();
    PERFORM * FROM pg_timezone_names;
    end_time := clock_timestamp();
    old_duration := end_time - start_time;
    
    -- Test new method (cached)
    start_time := clock_timestamp();
    PERFORM * FROM cached_timezones;
    end_time := clock_timestamp();
    new_duration := end_time - start_time;
    
    RAISE NOTICE 'Old method: %', old_duration;
    RAISE NOTICE 'New method: %', new_duration;
    RAISE NOTICE 'Improvement: % x faster', 
        ROUND((EXTRACT(EPOCH FROM old_duration) / EXTRACT(EPOCH FROM new_duration))::NUMERIC, 2);
END $$;


-- Step 6: Usage instructions
-- ============================================================================
DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== Usage Instructions ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Frontend/API: Replace all timezone queries with:';
    RAISE NOTICE '  SELECT * FROM get_timezones();';
    RAISE NOTICE '  or';
    RAISE NOTICE '  SELECT * FROM common_timezones;';
    RAISE NOTICE '';
    RAISE NOTICE 'To refresh cache (rarely needed):';
    RAISE NOTICE '  SELECT refresh_timezone_cache();';
    RAISE NOTICE '';
    RAISE NOTICE 'Expected Impact:';
    RAISE NOTICE '- 210 queries eliminated per period';
    RAISE NOTICE '- 100 seconds saved per period';
    RAISE NOTICE '- Query time: 476ms → <1ms (476x faster)';
    RAISE NOTICE '- Cache hit rate: 0%% → ~100%%';
    RAISE NOTICE '';
END $$;
