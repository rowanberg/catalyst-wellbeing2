-- ============================================
-- Add Per-Model Cooldown Support to gemini_api_keys
-- ============================================
-- Adds 60-second cooldown tracking for each model independently
-- Models: flash2, gemma_27b, gemma_12b, gemma_4b

-- Add cooldown columns for each model
ALTER TABLE public.gemini_api_keys
  ADD COLUMN IF NOT EXISTS flash2_is_in_cooldown BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS flash2_cooldown_expires_at TIMESTAMPTZ NULL,
  
  ADD COLUMN IF NOT EXISTS gemma_27b_is_in_cooldown BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS gemma_27b_cooldown_expires_at TIMESTAMPTZ NULL,
  
  ADD COLUMN IF NOT EXISTS gemma_12b_is_in_cooldown BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS gemma_12b_cooldown_expires_at TIMESTAMPTZ NULL,
  
  ADD COLUMN IF NOT EXISTS gemma_4b_is_in_cooldown BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS gemma_4b_cooldown_expires_at TIMESTAMPTZ NULL;

-- Add indexes for efficient cooldown queries
CREATE INDEX IF NOT EXISTS idx_gemini_flash2_cooldown 
ON public.gemini_api_keys(flash2_is_in_cooldown, flash2_cooldown_expires_at) 
WHERE flash2_is_in_cooldown = true;

CREATE INDEX IF NOT EXISTS idx_gemini_27b_cooldown 
ON public.gemini_api_keys(gemma_27b_is_in_cooldown, gemma_27b_cooldown_expires_at) 
WHERE gemma_27b_is_in_cooldown = true;

CREATE INDEX IF NOT EXISTS idx_gemini_12b_cooldown 
ON public.gemini_api_keys(gemma_12b_is_in_cooldown, gemma_12b_cooldown_expires_at) 
WHERE gemma_12b_is_in_cooldown = true;

CREATE INDEX IF NOT EXISTS idx_gemini_4b_cooldown 
ON public.gemini_api_keys(gemma_4b_is_in_cooldown, gemma_4b_cooldown_expires_at) 
WHERE gemma_4b_is_in_cooldown = true;

-- ============================================
-- Update get_available_gemini_key() to check cooldown
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
    v_cooldown_col TEXT;
    v_cooldown_expires_col TEXT;
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
            v_cooldown_col := 'flash2_is_in_cooldown';
            v_cooldown_expires_col := 'flash2_cooldown_expires_at';
        WHEN 'gemma-27b', 'gemma-3-27b' THEN
            v_daily_limit := 144000;
            v_minute_limit := 30;
            v_daily_col := 'gemma_27b_daily_count';
            v_minute_col := 'gemma_27b_minute_count';
            v_minute_reset_col := 'gemma_27b_last_minute_reset';
            v_daily_reset_col := 'gemma_27b_last_daily_reset';
            v_cooldown_col := 'gemma_27b_is_in_cooldown';
            v_cooldown_expires_col := 'gemma_27b_cooldown_expires_at';
        WHEN 'gemma-12b', 'gemma-3-12b' THEN
            v_daily_limit := 144000;
            v_minute_limit := 30;
            v_daily_col := 'gemma_12b_daily_count';
            v_minute_col := 'gemma_12b_minute_count';
            v_minute_reset_col := 'gemma_12b_last_minute_reset';
            v_daily_reset_col := 'gemma_12b_last_daily_reset';
            v_cooldown_col := 'gemma_12b_is_in_cooldown';
            v_cooldown_expires_col := 'gemma_12b_cooldown_expires_at';
        WHEN 'gemma-4b', 'gemma-3-4b' THEN
            v_daily_limit := 144000;
            v_minute_limit := 30;
            v_daily_col := 'gemma_4b_daily_count';
            v_minute_col := 'gemma_4b_minute_count';
            v_minute_reset_col := 'gemma_4b_last_minute_reset';
            v_daily_reset_col := 'gemma_4b_last_daily_reset';
            v_cooldown_col := 'gemma_4b_is_in_cooldown';
            v_cooldown_expires_col := 'gemma_4b_cooldown_expires_at';
        ELSE
            RAISE EXCEPTION 'Invalid model: %. Must be flash2, gemma-27b, gemma-12b, or gemma-4b', p_model;
    END CASE;
    
    -- Auto-reset expired cooldowns for this model (on-demand, no cron needed)
    EXECUTE format('
        UPDATE public.gemini_api_keys
        SET %I = false, %I = NULL
        WHERE %I = true AND %I <= NOW()',
        v_cooldown_col, v_cooldown_expires_col, 
        v_cooldown_col, v_cooldown_expires_col
    );
    
    -- Find and lock the best available key using dynamic SQL
    -- Exclude keys that are in cooldown for this specific model
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
            AND gak.%I = FALSE
            AND gak.%I < $1
            AND gak.%I < $2
        ORDER BY 
            gak.last_used_timestamp ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED',
        v_daily_col, v_minute_col, v_daily_reset_col, v_minute_reset_col, 
        v_cooldown_col, v_daily_col, v_minute_col
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

-- ============================================
-- Function to set model-specific cooldown
-- ============================================

CREATE OR REPLACE FUNCTION public.set_model_cooldown(
    p_key_id UUID,
    p_model TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_cooldown_col TEXT;
    v_cooldown_expires_col TEXT;
BEGIN
    -- Determine which cooldown columns to update based on model
    CASE p_model
        WHEN 'flash2' THEN
            v_cooldown_col := 'flash2_is_in_cooldown';
            v_cooldown_expires_col := 'flash2_cooldown_expires_at';
        WHEN 'gemma-27b', 'gemma-3-27b' THEN
            v_cooldown_col := 'gemma_27b_is_in_cooldown';
            v_cooldown_expires_col := 'gemma_27b_cooldown_expires_at';
        WHEN 'gemma-12b', 'gemma-3-12b' THEN
            v_cooldown_col := 'gemma_12b_is_in_cooldown';
            v_cooldown_expires_col := 'gemma_12b_cooldown_expires_at';
        WHEN 'gemma-4b', 'gemma-3-4b' THEN
            v_cooldown_col := 'gemma_4b_is_in_cooldown';
            v_cooldown_expires_col := 'gemma_4b_cooldown_expires_at';
        ELSE
            RAISE EXCEPTION 'Invalid model: %. Must be flash2, gemma-27b, gemma-12b, or gemma-4b', p_model;
    END CASE;
    
    -- Set cooldown for 61 seconds (1 minute + buffer)
    EXECUTE format('
        UPDATE public.gemini_api_keys
        SET 
            %I = true,
            %I = NOW() + INTERVAL ''61 seconds''
        WHERE id = $1',
        v_cooldown_col, v_cooldown_expires_col
    )
    USING p_key_id;
    
    RETURN FOUND;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_available_gemini_key(TEXT) TO service_role, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.set_model_cooldown(UUID, TEXT) TO service_role, authenticated, anon;

-- ============================================
-- Add comments for new columns
-- ============================================
COMMENT ON COLUMN public.gemini_api_keys.flash2_is_in_cooldown IS 'Flash 2 model in 60-second cooldown after rate limit';
COMMENT ON COLUMN public.gemini_api_keys.flash2_cooldown_expires_at IS 'Flash 2 cooldown expiration timestamp';

COMMENT ON COLUMN public.gemini_api_keys.gemma_27b_is_in_cooldown IS 'Gemma 27b model in 60-second cooldown after rate limit';
COMMENT ON COLUMN public.gemini_api_keys.gemma_27b_cooldown_expires_at IS 'Gemma 27b cooldown expiration timestamp';

COMMENT ON COLUMN public.gemini_api_keys.gemma_12b_is_in_cooldown IS 'Gemma 12b model in 60-second cooldown after rate limit';
COMMENT ON COLUMN public.gemini_api_keys.gemma_12b_cooldown_expires_at IS 'Gemma 12b cooldown expiration timestamp';

COMMENT ON COLUMN public.gemini_api_keys.gemma_4b_is_in_cooldown IS 'Gemma 4b model in 60-second cooldown after rate limit';
COMMENT ON COLUMN public.gemini_api_keys.gemma_4b_cooldown_expires_at IS 'Gemma 4b cooldown expiration timestamp';

-- ============================================
-- Summary of Changes
-- ============================================
-- ADDED per-model cooldown tracking (4 models × 2 columns = 8 new columns):
--   Each model gets: is_in_cooldown, cooldown_expires_at
--   Models: flash2, gemma_27b, gemma_12b, gemma_4b
--   Cooldown duration: 61 seconds (1 minute + buffer)
--
-- FUNCTIONS:
--   - get_available_gemini_key(): Auto-resets expired cooldowns on-demand (no cron needed)
--   - set_model_cooldown(): Sets 61-second cooldown for specific model when 429 error occurs
--
-- PERFORMANCE:
--   - Zero background overhead (no cron jobs or edge functions needed)
--   - Cooldowns reset automatically during key requests
--   - Adds ~5ms per key request for auto-reset check
