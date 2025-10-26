-- ============================================
-- AI Chat Quota System Migration
-- ============================================
-- Extends the AI system with user quotas and Gemma-3 model support

-- ============================================
-- 1. User Quotas Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_ai_quotas (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    normal_daily_usage INTEGER NOT NULL DEFAULT 0,  -- Max 30/day
    extra_daily_usage INTEGER NOT NULL DEFAULT 0,   -- Max 500/day
    last_reset_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_requests_today INTEGER GENERATED ALWAYS AS (normal_daily_usage + extra_daily_usage) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_quotas_reset ON public.user_ai_quotas (last_reset_timestamp);
CREATE INDEX IF NOT EXISTS idx_user_quotas_usage ON public.user_ai_quotas (normal_daily_usage, extra_daily_usage);

-- ============================================
-- 2. Gemma API Keys Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.gemma_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(50) NOT NULL CHECK (model_name IN ('gemma-3-27b', 'gemma-3-12b', 'gemma-3-4b')),
    encrypted_api_key TEXT NOT NULL,
    
    -- Rate limit tracking (per minute)
    current_minute_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    rpm_used INTEGER NOT NULL DEFAULT 0,  -- Requests per minute (max 30)
    tpm_used INTEGER NOT NULL DEFAULT 0,  -- Tokens per minute (max 15,000)
    
    -- Daily limits
    last_daily_reset TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    rpd_used INTEGER NOT NULL DEFAULT 0,  -- Requests per day (max 144,000)
    
    -- Status and metadata
    is_disabled BOOLEAN NOT NULL DEFAULT FALSE,
    last_used_timestamp TIMESTAMPTZ,
    priority_order INTEGER NOT NULL DEFAULT 100,  -- Lower number = higher priority
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient key selection
CREATE INDEX IF NOT EXISTS idx_gemma_keys_availability 
ON public.gemma_api_keys (model_name, is_disabled, priority_order);

CREATE INDEX IF NOT EXISTS idx_gemma_keys_limits 
ON public.gemma_api_keys (model_name, rpm_used, tpm_used, rpd_used);

CREATE INDEX IF NOT EXISTS idx_gemma_keys_minute_window 
ON public.gemma_api_keys (current_minute_timestamp);

-- ============================================
-- 3. AI Request Logs Table (for tracking and analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_request_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    request_type VARCHAR(20) NOT NULL CHECK (request_type IN ('normal', 'extra')),
    model_used VARCHAR(50) NOT NULL,
    key_id UUID REFERENCES public.gemma_api_keys(id),
    tokens_used INTEGER,
    response_time_ms INTEGER,
    success BOOLEAN NOT NULL DEFAULT TRUE,
    error_message TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for analytics
CREATE INDEX IF NOT EXISTS idx_ai_logs_user ON public.ai_request_logs (user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_logs_model ON public.ai_request_logs (model_used, timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_logs_key ON public.ai_request_logs (key_id, timestamp);

-- ============================================
-- 4. Model Priority Configuration Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_model_config (
    model_name VARCHAR(50) PRIMARY KEY,
    priority_order INTEGER NOT NULL,
    rpm_limit INTEGER NOT NULL DEFAULT 30,
    tpm_limit INTEGER NOT NULL DEFAULT 15000,
    rpd_limit INTEGER NOT NULL DEFAULT 144000,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Insert default model configurations
INSERT INTO public.ai_model_config (model_name, priority_order, rpm_limit, tpm_limit, rpd_limit) VALUES
    ('gemma-3-27b', 1, 30, 15000, 144000),
    ('gemma-3-12b', 2, 30, 15000, 144000),
    ('gemma-3-4b', 3, 30, 15000, 144000)
ON CONFLICT (model_name) DO NOTHING;

-- ============================================
-- 5. Helper Functions
-- ============================================

-- Function to get or create user quota
CREATE OR REPLACE FUNCTION public.get_or_create_user_quota(p_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    normal_daily_usage INTEGER,
    extra_daily_usage INTEGER,
    can_use_normal BOOLEAN,
    can_use_extra BOOLEAN,
    needs_reset BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_now TIMESTAMPTZ := NOW();
    v_quota RECORD;
    v_needs_reset BOOLEAN;
BEGIN
    -- Get existing quota or create new one
    INSERT INTO public.user_ai_quotas (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Get the quota record
    SELECT * INTO v_quota FROM public.user_ai_quotas WHERE user_ai_quotas.user_id = p_user_id;
    
    -- Check if daily reset is needed (new day in UTC)
    v_needs_reset := DATE_TRUNC('day', v_now AT TIME ZONE 'UTC') > 
                     DATE_TRUNC('day', v_quota.last_reset_timestamp AT TIME ZONE 'UTC');
    
    -- Reset if needed
    IF v_needs_reset THEN
        UPDATE public.user_ai_quotas
        SET normal_daily_usage = 0,
            extra_daily_usage = 0,
            last_reset_timestamp = v_now,
            updated_at = v_now
        WHERE user_ai_quotas.user_id = p_user_id;
        
        -- Refresh the record
        SELECT * INTO v_quota FROM public.user_ai_quotas WHERE user_ai_quotas.user_id = p_user_id;
    END IF;
    
    RETURN QUERY SELECT 
        v_quota.user_id,
        v_quota.normal_daily_usage,
        v_quota.extra_daily_usage,
        (v_quota.normal_daily_usage < 30) AS can_use_normal,
        (v_quota.normal_daily_usage >= 30 AND v_quota.extra_daily_usage < 500) AS can_use_extra,
        v_needs_reset;
END;
$$;

-- Function to increment user quota
CREATE OR REPLACE FUNCTION public.increment_user_quota(
    p_user_id UUID,
    p_request_type VARCHAR(20)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_success BOOLEAN := FALSE;
BEGIN
    IF p_request_type = 'normal' THEN
        UPDATE public.user_ai_quotas
        SET normal_daily_usage = normal_daily_usage + 1,
            updated_at = NOW()
        WHERE user_id = p_user_id
        AND normal_daily_usage < 30
        RETURNING TRUE INTO v_success;
    ELSIF p_request_type = 'extra' THEN
        UPDATE public.user_ai_quotas
        SET extra_daily_usage = extra_daily_usage + 1,
            updated_at = NOW()
        WHERE user_id = p_user_id
        AND extra_daily_usage < 500
        RETURNING TRUE INTO v_success;
    END IF;
    
    RETURN COALESCE(v_success, FALSE);
END;
$$;

-- Function to get available Gemma API key
CREATE OR REPLACE FUNCTION public.get_available_gemma_key(p_model_name VARCHAR(50))
RETURNS TABLE (
    key_id UUID,
    encrypted_key TEXT,
    model_name VARCHAR(50),
    remaining_rpm INTEGER,
    remaining_tpm INTEGER,
    remaining_rpd INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_key RECORD;
    v_now TIMESTAMPTZ := NOW();
    v_needs_minute_reset BOOLEAN;
    v_needs_daily_reset BOOLEAN;
    v_config RECORD;
BEGIN
    -- Get model configuration
    SELECT * INTO v_config FROM public.ai_model_config 
    WHERE ai_model_config.model_name = p_model_name AND is_active = TRUE;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Find and lock the best available key
    FOR v_key IN
        SELECT gak.*
        FROM public.gemma_api_keys gak
        WHERE 
            gak.model_name = p_model_name
            AND gak.is_disabled = FALSE
        ORDER BY 
            gak.priority_order ASC,
            gak.rpm_used ASC,
            gak.last_used_timestamp ASC NULLS FIRST
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    LOOP
        -- Check if minute reset is needed (60 seconds passed)
        v_needs_minute_reset := (v_now >= v_key.current_minute_timestamp + INTERVAL '1 minute');
        
        -- Check if daily reset is needed (new UTC day)
        v_needs_daily_reset := DATE_TRUNC('day', v_now AT TIME ZONE 'UTC') > 
                               DATE_TRUNC('day', v_key.last_daily_reset AT TIME ZONE 'UTC');
        
        -- Reset counters if needed
        IF v_needs_minute_reset THEN
            UPDATE public.gemma_api_keys
            SET rpm_used = 0,
                tpm_used = 0,
                current_minute_timestamp = v_now
            WHERE id = v_key.id;
            v_key.rpm_used := 0;
            v_key.tpm_used := 0;
        END IF;
        
        IF v_needs_daily_reset THEN
            UPDATE public.gemma_api_keys
            SET rpd_used = 0,
                last_daily_reset = v_now
            WHERE id = v_key.id;
            v_key.rpd_used := 0;
        END IF;
        
        -- Check if key is within limits
        IF v_key.rpm_used < v_config.rpm_limit 
           AND v_key.tpm_used < v_config.tpm_limit 
           AND v_key.rpd_used < v_config.rpd_limit THEN
            
            -- Update last used timestamp
            UPDATE public.gemma_api_keys
            SET last_used_timestamp = v_now,
                updated_at = v_now
            WHERE id = v_key.id;
            
            -- Return the key info
            RETURN QUERY SELECT 
                v_key.id,
                v_key.encrypted_api_key,
                v_key.model_name,
                (v_config.rpm_limit - v_key.rpm_used)::INTEGER,
                (v_config.tpm_limit - v_key.tpm_used)::INTEGER,
                (v_config.rpd_limit - v_key.rpd_used)::INTEGER;
            RETURN;
        END IF;
    END LOOP;
    
    -- No available key found
    RETURN;
END;
$$;

-- Function to update key usage after API call
CREATE OR REPLACE FUNCTION public.update_gemma_key_usage(
    p_key_id UUID,
    p_tokens_used INTEGER DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.gemma_api_keys
    SET rpm_used = rpm_used + 1,
        tpm_used = tpm_used + p_tokens_used,
        rpd_used = rpd_used + 1,
        updated_at = NOW()
    WHERE id = p_key_id;
END;
$$;

-- ============================================
-- 6. Row Level Security
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.user_ai_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gemma_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_model_config ENABLE ROW LEVEL SECURITY;

-- User quotas: Users can only see their own quota
CREATE POLICY "Users can view own quota" 
ON public.user_ai_quotas 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Gemma keys: Only service role can access
CREATE POLICY "Service role only for Gemma keys" 
ON public.gemma_api_keys 
FOR ALL 
TO service_role 
USING (true);

-- Request logs: Users can see their own logs
CREATE POLICY "Users can view own request logs" 
ON public.ai_request_logs 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Model config: Public read access
CREATE POLICY "Public read for model config" 
ON public.ai_model_config 
FOR SELECT 
TO authenticated 
USING (true);

-- ============================================
-- 7. Triggers for automatic timestamp updates
-- ============================================
CREATE TRIGGER update_user_quotas_updated_at
    BEFORE UPDATE ON public.user_ai_quotas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gemma_keys_updated_at
    BEFORE UPDATE ON public.gemma_api_keys
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 8. Comments for documentation
-- ============================================
COMMENT ON TABLE public.user_ai_quotas IS 'Tracks daily AI request quotas for users (30 normal + 500 extra)';
COMMENT ON TABLE public.gemma_api_keys IS 'Stores Gemma-3 model API keys with rate limit tracking';
COMMENT ON TABLE public.ai_request_logs IS 'Logs all AI requests for analytics and debugging';
COMMENT ON TABLE public.ai_model_config IS 'Configuration for AI model priorities and limits';

COMMENT ON FUNCTION public.get_or_create_user_quota IS 'Gets or creates user quota, handles daily reset';
COMMENT ON FUNCTION public.increment_user_quota IS 'Increments user quota usage (normal or extra)';
COMMENT ON FUNCTION public.get_available_gemma_key IS 'Gets an available API key for specified Gemma model';
COMMENT ON FUNCTION public.update_gemma_key_usage IS 'Updates key usage counters after API call';
