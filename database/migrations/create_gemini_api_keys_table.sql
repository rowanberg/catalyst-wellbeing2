-- ============================================
-- Gemini API Keys Table Migration
-- ============================================
-- Creates the table to store and manage 100+ Gemini API keys
-- with rate limiting tracking and encryption support

-- Create the gemini_api_keys table
CREATE TABLE IF NOT EXISTS public.gemini_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encrypted_api_key TEXT NOT NULL,
    daily_request_count INTEGER NOT NULL DEFAULT 0,
    last_reset_timestamp_daily TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_minute_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_minute_request_count INTEGER NOT NULL DEFAULT 0,
    is_disabled BOOLEAN NOT NULL DEFAULT FALSE,
    last_used_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_gemini_keys_availability 
ON public.gemini_api_keys (is_disabled, daily_request_count);

CREATE INDEX IF NOT EXISTS idx_gemini_keys_last_used 
ON public.gemini_api_keys (last_used_timestamp);

CREATE INDEX IF NOT EXISTS idx_gemini_keys_minute_window 
ON public.gemini_api_keys (current_minute_timestamp);

-- Enable Row Level Security
ALTER TABLE public.gemini_api_keys ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies
-- ============================================
-- CRITICAL: Only service_role can access this table
-- Clients (anon/authenticated) have NO access

-- Drop existing policies if any
DROP POLICY IF EXISTS "Service role only - SELECT" ON public.gemini_api_keys;
DROP POLICY IF EXISTS "Service role only - UPDATE" ON public.gemini_api_keys;
DROP POLICY IF EXISTS "Service role only - INSERT" ON public.gemini_api_keys;
DROP POLICY IF EXISTS "Service role only - DELETE" ON public.gemini_api_keys;

-- Deny all access to anon and authenticated users
CREATE POLICY "Deny all for anon users" 
ON public.gemini_api_keys 
FOR ALL 
TO anon 
USING (false);

CREATE POLICY "Deny all for authenticated users" 
ON public.gemini_api_keys 
FOR ALL 
TO authenticated 
USING (false);

-- Service role has full access (used by Edge Functions)
-- Note: service_role bypasses RLS by default, but we document it here

-- ============================================
-- Helper Functions
-- ============================================

-- Function to get an available API key (PostgreSQL function for better performance)
CREATE OR REPLACE FUNCTION public.get_available_gemini_key()
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
    v_current_minute_ts TIMESTAMPTZ;
    v_now TIMESTAMPTZ := NOW();
    v_daily_limit INTEGER := 1000;
    v_minute_limit INTEGER := 15;
    v_needs_daily_reset BOOLEAN;
    v_needs_minute_reset BOOLEAN;
BEGIN
    -- Find and lock the best available key
    SELECT 
        gak.id,
        gak.encrypted_api_key,
        gak.daily_request_count,
        gak.current_minute_request_count,
        gak.last_reset_timestamp_daily,
        gak.current_minute_timestamp
    INTO 
        v_key_id,
        v_encrypted_key,
        v_daily_count,
        v_minute_count,
        v_last_daily_reset,
        v_current_minute_ts
    FROM public.gemini_api_keys gak
    WHERE 
        gak.is_disabled = FALSE
        AND gak.daily_request_count < v_daily_limit
    ORDER BY 
        gak.last_used_timestamp ASC  -- Rotate through keys
    LIMIT 1
    FOR UPDATE SKIP LOCKED;  -- Skip locked rows for concurrency
    
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
    v_needs_minute_reset := (v_now >= v_current_minute_ts + INTERVAL '1 minute');
    
    -- Reset counters if needed
    IF v_needs_daily_reset THEN
        v_daily_count := 0;
        v_last_daily_reset := v_now;
    END IF;
    
    IF v_needs_minute_reset THEN
        v_minute_count := 0;
        v_current_minute_ts := v_now;
    END IF;
    
    -- Check if key is still available after resets
    IF v_daily_count >= v_daily_limit OR v_minute_count >= v_minute_limit THEN
        RETURN;  -- Key not available
    END IF;
    
    -- Update the key with incremented counters
    UPDATE public.gemini_api_keys
    SET 
        daily_request_count = v_daily_count + 1,
        current_minute_request_count = v_minute_count + 1,
        last_reset_timestamp_daily = v_last_daily_reset,
        current_minute_timestamp = v_current_minute_ts,
        last_used_timestamp = v_now,
        updated_at = v_now
    WHERE id = v_key_id;
    
    -- Return the key info
    RETURN QUERY SELECT 
        v_key_id,
        v_encrypted_key,
        (v_daily_limit - (v_daily_count + 1))::INTEGER,
        (v_minute_limit - (v_minute_count + 1))::INTEGER;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.get_available_gemini_key() TO service_role;

-- ============================================
-- Automated timestamp update trigger
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gemini_api_keys_updated_at
    BEFORE UPDATE ON public.gemini_api_keys
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE public.gemini_api_keys IS 'Stores encrypted Gemini API keys for rate-limited rotation';
COMMENT ON COLUMN public.gemini_api_keys.encrypted_api_key IS 'AES-256-GCM encrypted Gemini API key';
COMMENT ON COLUMN public.gemini_api_keys.daily_request_count IS 'Number of requests today (resets at midnight UTC)';
COMMENT ON COLUMN public.gemini_api_keys.last_reset_timestamp_daily IS 'When daily counter was last reset';
COMMENT ON COLUMN public.gemini_api_keys.current_minute_timestamp IS 'Start of current 60-second window';
COMMENT ON COLUMN public.gemini_api_keys.current_minute_request_count IS 'Requests in current minute (resets every 60s)';
COMMENT ON COLUMN public.gemini_api_keys.is_disabled IS 'If true, key will not be used';
COMMENT ON COLUMN public.gemini_api_keys.last_used_timestamp IS 'Last time this key was selected for use';
