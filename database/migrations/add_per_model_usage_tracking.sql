-- ============================================
-- Add Per-Model Usage Tracking to gemini_api_keys
-- ============================================
-- Separates usage tracking for Gemini Flash 2 and three Gemma models
-- Each model has different rate limits:
-- - Flash 2: 15 rpm, 200 rpd
-- - Gemma 3-27b: 30 rpm, 15000 tpm, 144000 rpd
-- - Gemma 3-12b: 30 rpm, 15000 tpm, 144000 rpd
-- - Gemma 3-4b: 30 rpm, 15000 tpm, 144000 rpd

-- Add separate usage columns for each model
ALTER TABLE public.gemini_api_keys
  ADD COLUMN IF NOT EXISTS flash2_daily_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS flash2_minute_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS flash2_last_minute_reset TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS flash2_last_daily_reset TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  ADD COLUMN IF NOT EXISTS gemma_27b_daily_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gemma_27b_minute_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gemma_27b_last_minute_reset TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS gemma_27b_last_daily_reset TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  ADD COLUMN IF NOT EXISTS gemma_12b_daily_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gemma_12b_minute_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gemma_12b_last_minute_reset TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS gemma_12b_last_daily_reset TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  ADD COLUMN IF NOT EXISTS gemma_4b_daily_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gemma_4b_minute_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gemma_4b_last_minute_reset TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS gemma_4b_last_daily_reset TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Migrate existing data to flash2 columns (one-time operation)
UPDATE public.gemini_api_keys
SET 
  flash2_daily_count = COALESCE(daily_request_count, 0),
  flash2_minute_count = COALESCE(current_minute_request_count, 0),
  flash2_last_minute_reset = COALESCE(current_minute_timestamp, NOW()),
  flash2_last_daily_reset = COALESCE(last_reset_timestamp_daily, NOW())
WHERE flash2_daily_count = 0; -- Only migrate if not already migrated

-- Drop deprecated unified tracking columns
-- These are replaced by per-model tracking
ALTER TABLE public.gemini_api_keys
  DROP COLUMN IF EXISTS daily_request_count,
  DROP COLUMN IF EXISTS current_minute_request_count,
  DROP COLUMN IF EXISTS current_minute_timestamp,
  DROP COLUMN IF EXISTS last_reset_timestamp_daily;

-- Add indexes for each model
CREATE INDEX IF NOT EXISTS idx_gemini_flash2_usage 
ON public.gemini_api_keys (flash2_daily_count, flash2_minute_count);

CREATE INDEX IF NOT EXISTS idx_gemini_27b_usage 
ON public.gemini_api_keys (gemma_27b_daily_count, gemma_27b_minute_count);

CREATE INDEX IF NOT EXISTS idx_gemini_12b_usage 
ON public.gemini_api_keys (gemma_12b_daily_count, gemma_12b_minute_count);

CREATE INDEX IF NOT EXISTS idx_gemini_4b_usage 
ON public.gemini_api_keys (gemma_4b_daily_count, gemma_4b_minute_count);

-- ============================================
-- Updated Helper Function with Model-Specific Tracking
-- ============================================

CREATE OR REPLACE FUNCTION public.get_available_gemini_key(p_model TEXT DEFAULT 'flash2')
RETURNS TABLE (
    key_id UUID,
    encrypted_key TEXT,
    remaining_daily INTEGER,
    remaining_minute INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_key_id UUID;
    v_encrypted_key TEXT;
    v_daily_count INTEGER;
    v_minute_count INTEGER;
    v_last_daily_reset TIMESTAMPTZ;
    v_last_minute_reset TIMESTAMPTZ;
    v_now TIMESTAMPTZ := NOW();
    v_daily_limit INTEGER;
    v_minute_limit INTEGER;
    v_needs_daily_reset BOOLEAN;
    v_needs_minute_reset BOOLEAN;
    
    -- Column names based on model
    v_daily_col TEXT;
    v_minute_col TEXT;
    v_minute_reset_col TEXT;
    v_daily_reset_col TEXT;
BEGIN
    -- Set limits and column names based on model
    CASE p_model
        WHEN 'flash2' THEN
            v_daily_limit := 200;
            v_minute_limit := 15;
            v_daily_col := 'flash2_daily_count';
            v_minute_col := 'flash2_minute_count';
            v_minute_reset_col := 'flash2_last_minute_reset';
            v_daily_reset_col := 'flash2_last_daily_reset';
        WHEN 'gemma-27b', 'gemma-3-27b' THEN
            v_daily_limit := 144000;
            v_minute_limit := 30;
            v_daily_col := 'gemma_27b_daily_count';
            v_minute_col := 'gemma_27b_minute_count';
            v_minute_reset_col := 'gemma_27b_last_minute_reset';
            v_daily_reset_col := 'gemma_27b_last_daily_reset';
        WHEN 'gemma-12b', 'gemma-3-12b' THEN
            v_daily_limit := 144000;
            v_minute_limit := 30;
            v_daily_col := 'gemma_12b_daily_count';
            v_minute_col := 'gemma_12b_minute_count';
            v_minute_reset_col := 'gemma_12b_last_minute_reset';
            v_daily_reset_col := 'gemma_12b_last_daily_reset';
        WHEN 'gemma-4b', 'gemma-3-4b' THEN
            v_daily_limit := 144000;
            v_minute_limit := 30;
            v_daily_col := 'gemma_4b_daily_count';
            v_minute_col := 'gemma_4b_minute_count';
            v_minute_reset_col := 'gemma_4b_last_minute_reset';
            v_daily_reset_col := 'gemma_4b_last_daily_reset';
        ELSE
            RAISE EXCEPTION 'Invalid model: %. Must be flash2, gemma-27b, gemma-12b, or gemma-4b', p_model;
    END CASE;
    
    -- Find and lock the best available key using dynamic SQL
    EXECUTE format('
        SELECT 
            gak.id,
            gak.encrypted_api_key,
            gak.%I,
            gak.%I,
            gak.%I,
            gak.%I
        FROM public.gemini_api_keys gak
        WHERE 
            gak.is_disabled = FALSE
            AND gak.%I < $1
            AND gak.%I < $2
        ORDER BY 
            gak.last_used_timestamp ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED',
        v_daily_col, v_minute_col, v_daily_reset_col, v_minute_reset_col, v_daily_col, v_minute_col
    )
    INTO v_key_id, v_encrypted_key, v_daily_count, v_minute_count, 
         v_last_daily_reset, v_last_minute_reset
    USING v_daily_limit, v_minute_limit;
    
    -- If no key found, return empty
    IF v_key_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Check if daily reset is needed (new UTC day)
    v_needs_daily_reset := (
        DATE_TRUNC('day', v_now AT TIME ZONE 'UTC') > 
        DATE_TRUNC('day', v_last_daily_reset AT TIME ZONE 'UTC')
    );
    
    -- Check if minute reset is needed (60 seconds passed)
    v_needs_minute_reset := (v_now >= v_last_minute_reset + INTERVAL '1 minute');
    
    -- Reset counters if needed
    IF v_needs_daily_reset THEN
        v_daily_count := 0;
        v_last_daily_reset := v_now;
    END IF;
    
    IF v_needs_minute_reset THEN
        v_minute_count := 0;
        v_last_minute_reset := v_now;
    END IF;
    
    -- Check if key is still available after resets
    IF v_daily_count >= v_daily_limit OR v_minute_count >= v_minute_limit THEN
        RETURN;  -- Key not available
    END IF;
    
    -- Update the key with incremented counters using dynamic SQL
    EXECUTE format('
        UPDATE public.gemini_api_keys
        SET 
            %I = $1,
            %I = $2,
            %I = $3,
            %I = $4,
            last_used_timestamp = $5,
            updated_at = $5
        WHERE id = $6',
        v_daily_col, v_minute_col, v_daily_reset_col, v_minute_reset_col
    )
    USING v_daily_count + 1, v_minute_count + 1, v_last_daily_reset, 
          v_last_minute_reset, v_now, v_key_id;
    
    -- Return the key info
    RETURN QUERY SELECT 
        v_key_id,
        v_encrypted_key,
        (v_daily_limit - (v_daily_count + 1))::INTEGER,
        (v_minute_limit - (v_minute_count + 1))::INTEGER;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.get_available_gemini_key(TEXT) TO service_role;

-- ============================================
-- Add comments for new columns
-- ============================================
COMMENT ON COLUMN public.gemini_api_keys.flash2_daily_count IS 'Flash 2 model daily requests (200 limit)';
COMMENT ON COLUMN public.gemini_api_keys.flash2_minute_count IS 'Flash 2 model per-minute requests (15 limit)';
COMMENT ON COLUMN public.gemini_api_keys.flash2_last_minute_reset IS 'Flash 2 last minute window reset timestamp';
COMMENT ON COLUMN public.gemini_api_keys.flash2_last_daily_reset IS 'Flash 2 last daily reset timestamp (UTC midnight)';

COMMENT ON COLUMN public.gemini_api_keys.gemma_27b_daily_count IS 'Gemma 3-27b daily requests (144000 limit)';
COMMENT ON COLUMN public.gemini_api_keys.gemma_27b_minute_count IS 'Gemma 3-27b per-minute requests (30 limit)';
COMMENT ON COLUMN public.gemini_api_keys.gemma_27b_last_minute_reset IS 'Gemma 27b last minute window reset timestamp';
COMMENT ON COLUMN public.gemini_api_keys.gemma_27b_last_daily_reset IS 'Gemma 27b last daily reset timestamp (UTC midnight)';

COMMENT ON COLUMN public.gemini_api_keys.gemma_12b_daily_count IS 'Gemma 3-12b daily requests (144000 limit)';
COMMENT ON COLUMN public.gemini_api_keys.gemma_12b_minute_count IS 'Gemma 3-12b per-minute requests (30 limit)';
COMMENT ON COLUMN public.gemini_api_keys.gemma_12b_last_minute_reset IS 'Gemma 12b last minute window reset timestamp';
COMMENT ON COLUMN public.gemini_api_keys.gemma_12b_last_daily_reset IS 'Gemma 12b last daily reset timestamp (UTC midnight)';

COMMENT ON COLUMN public.gemini_api_keys.gemma_4b_daily_count IS 'Gemma 3-4b daily requests (144000 limit)';
COMMENT ON COLUMN public.gemini_api_keys.gemma_4b_minute_count IS 'Gemma 3-4b per-minute requests (30 limit)';
COMMENT ON COLUMN public.gemini_api_keys.gemma_4b_last_minute_reset IS 'Gemma 4b last minute window reset timestamp';
COMMENT ON COLUMN public.gemini_api_keys.gemma_4b_last_daily_reset IS 'Gemma 4b last daily reset timestamp (UTC midnight)';

-- ============================================
-- Summary of Changes
-- ============================================
-- REMOVED unified tracking columns:
--   - daily_request_count
--   - current_minute_request_count  
--   - current_minute_timestamp
--   - last_reset_timestamp_daily
--
-- ADDED per-model tracking (4 models × 4 columns = 16 new columns):
--   Each model tracks: daily_count, minute_count, last_minute_reset, last_daily_reset
--   Models: flash2, gemma_27b, gemma_12b, gemma_4b
