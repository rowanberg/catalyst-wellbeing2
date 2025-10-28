-- ============================================================================
-- On-Demand Counter Reset Functions
-- ============================================================================
-- Lightweight reset functions called during key selection (no pg_cron needed)
-- Only resets when keys are actually being used - zero overhead when idle
-- ============================================================================

-- ============================================================================
-- Inline Reset Logic (Called during key selection)
-- ============================================================================
-- These resets happen automatically in the Edge Function during key queries
-- No background jobs needed - zero overhead when idle
-- ============================================================================

-- Note: The Edge Function handles resets inline:
-- 1. Expired cooldowns cleared via WHERE clause: cooldown_expires_at < NOW()
-- 2. RPM reset checked: if (now - last_rpm_reset) > 60 seconds, reset to 0
-- 3. RPD reset checked: if (now - last_rpd_reset) > 24 hours, reset to 0

-- ============================================================================
-- Manual Admin Functions (Optional - for troubleshooting only)
-- ============================================================================

-- Force reset all RPM counters (admin only)
CREATE OR REPLACE FUNCTION admin_reset_all_rpm_counters()
RETURNS TABLE(model TEXT, keys_reset BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  count_25_lite BIGINT;
  count_25 BIGINT;
  count_20_lite BIGINT;
BEGIN
  -- Reset Gemini 2.5 Flash Lite
  WITH updated AS (
    UPDATE public.gemini_25_flash_lite_keys
    SET current_rpm = 0, last_rpm_reset = NOW()
    WHERE current_rpm > 0
    RETURNING id
  )
  SELECT COUNT(*) INTO count_25_lite FROM updated;
  
  -- Reset Gemini 2.5 Flash
  WITH updated AS (
    UPDATE public.gemini_25_flash_keys
    SET current_rpm = 0, last_rpm_reset = NOW()
    WHERE current_rpm > 0
    RETURNING id
  )
  SELECT COUNT(*) INTO count_25 FROM updated;
  
  -- Reset Gemini 2.0 Flash Lite
  WITH updated AS (
    UPDATE public.gemini_20_flash_lite_keys
    SET current_rpm = 0, last_rpm_reset = NOW()
    WHERE current_rpm > 0
    RETURNING id
  )
  SELECT COUNT(*) INTO count_20_lite FROM updated;
  
  -- Return results
  RETURN QUERY
  SELECT 'Gemini 2.5 Flash Lite'::TEXT, count_25_lite
  UNION ALL
  SELECT 'Gemini 2.5 Flash'::TEXT, count_25
  UNION ALL
  SELECT 'Gemini 2.0 Flash Lite'::TEXT, count_20_lite;
END;
$$;

-- Force reset all RPD counters (admin only)
CREATE OR REPLACE FUNCTION admin_reset_all_rpd_counters()
RETURNS TABLE(model TEXT, keys_reset BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  count_25_lite BIGINT;
  count_25 BIGINT;
  count_20_lite BIGINT;
BEGIN
  -- Reset Gemini 2.5 Flash Lite
  WITH updated AS (
    UPDATE public.gemini_25_flash_lite_keys
    SET current_rpd = 0, current_tpm = 0, last_rpd_reset = NOW()
    WHERE current_rpd > 0 OR current_tpm > 0
    RETURNING id
  )
  SELECT COUNT(*) INTO count_25_lite FROM updated;
  
  -- Reset Gemini 2.5 Flash
  WITH updated AS (
    UPDATE public.gemini_25_flash_keys
    SET current_rpd = 0, current_tpm = 0, last_rpd_reset = NOW()
    WHERE current_rpd > 0 OR current_tpm > 0
    RETURNING id
  )
  SELECT COUNT(*) INTO count_25 FROM updated;
  
  -- Reset Gemini 2.0 Flash Lite
  WITH updated AS (
    UPDATE public.gemini_20_flash_lite_keys
    SET current_rpd = 0, current_tpm = 0, last_rpd_reset = NOW()
    WHERE current_rpd > 0 OR current_tpm > 0
    RETURNING id
  )
  SELECT COUNT(*) INTO count_20_lite FROM updated;
  
  -- Return results
  RETURN QUERY
  SELECT 'Gemini 2.5 Flash Lite'::TEXT, count_25_lite
  UNION ALL
  SELECT 'Gemini 2.5 Flash'::TEXT, count_25
  UNION ALL
  SELECT 'Gemini 2.0 Flash Lite'::TEXT, count_20_lite;
END;
$$;

-- Force clear all cooldowns (admin only)
CREATE OR REPLACE FUNCTION admin_clear_all_cooldowns()
RETURNS TABLE(model TEXT, cooldowns_cleared BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  count_25_lite BIGINT;
  count_25 BIGINT;
  count_20_lite BIGINT;
BEGIN
  -- Clear Gemini 2.5 Flash Lite cooldowns
  WITH updated AS (
    UPDATE public.gemini_25_flash_lite_keys
    SET is_in_cooldown = FALSE, cooldown_expires_at = NULL
    WHERE is_in_cooldown = TRUE
    RETURNING id
  )
  SELECT COUNT(*) INTO count_25_lite FROM updated;
  
  -- Clear Gemini 2.5 Flash cooldowns
  WITH updated AS (
    UPDATE public.gemini_25_flash_keys
    SET is_in_cooldown = FALSE, cooldown_expires_at = NULL
    WHERE is_in_cooldown = TRUE
    RETURNING id
  )
  SELECT COUNT(*) INTO count_25 FROM updated;
  
  -- Clear Gemini 2.0 Flash Lite cooldowns
  WITH updated AS (
    UPDATE public.gemini_20_flash_lite_keys
    SET is_in_cooldown = FALSE, cooldown_expires_at = NULL
    WHERE is_in_cooldown = TRUE
    RETURNING id
  )
  SELECT COUNT(*) INTO count_20_lite FROM updated;
  
  -- Return results
  RETURN QUERY
  SELECT 'Gemini 2.5 Flash Lite'::TEXT, count_25_lite
  UNION ALL
  SELECT 'Gemini 2.5 Flash'::TEXT, count_25
  UNION ALL
  SELECT 'Gemini 2.0 Flash Lite'::TEXT, count_20_lite;
END;
$$;

-- ============================================================================
-- Monitoring Function
-- ============================================================================
CREATE OR REPLACE FUNCTION get_key_usage_summary()
RETURNS TABLE(
  model_family TEXT,
  total_keys BIGINT,
  active_keys BIGINT,
  in_cooldown BIGINT,
  avg_rpm_usage NUMERIC,
  avg_rpd_usage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  
  -- Gemini 2.5 Flash Lite
  SELECT 
    'Gemini 2.5 Flash Lite'::TEXT,
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE status = 'active')::BIGINT,
    COUNT(*) FILTER (WHERE is_in_cooldown = TRUE)::BIGINT,
    AVG(current_rpm)::NUMERIC,
    AVG(current_rpd)::NUMERIC
  FROM public.gemini_25_flash_lite_keys
  
  UNION ALL
  
  -- Gemini 2.5 Flash
  SELECT 
    'Gemini 2.5 Flash'::TEXT,
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE status = 'active')::BIGINT,
    COUNT(*) FILTER (WHERE is_in_cooldown = TRUE)::BIGINT,
    AVG(current_rpm)::NUMERIC,
    AVG(current_rpd)::NUMERIC
  FROM public.gemini_25_flash_keys
  
  UNION ALL
  
  -- Gemini 2.0 Flash Lite
  SELECT 
    'Gemini 2.0 Flash Lite'::TEXT,
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE status = 'active')::BIGINT,
    COUNT(*) FILTER (WHERE is_in_cooldown = TRUE)::BIGINT,
    AVG(current_rpm)::NUMERIC,
    AVG(current_rpd)::NUMERIC
  FROM public.gemini_20_flash_lite_keys;
END;
$$;

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON FUNCTION admin_reset_all_rpm_counters() IS 'Manual admin function to force reset all RPM counters (for troubleshooting)';
COMMENT ON FUNCTION admin_reset_all_rpd_counters() IS 'Manual admin function to force reset all RPD counters (for troubleshooting)';
COMMENT ON FUNCTION admin_clear_all_cooldowns() IS 'Manual admin function to force clear all cooldowns (for troubleshooting)';
COMMENT ON FUNCTION get_key_usage_summary() IS 'Returns summary of key usage across all model families for monitoring';
