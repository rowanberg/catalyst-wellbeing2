-- ============================================
-- Simplified AI Chat Quota System Migration
-- ============================================
-- Uses existing Gemini API keys for both normal and extra quotas

-- ============================================
-- 1. User Quotas Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_ai_quotas (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    normal_daily_usage INTEGER NOT NULL DEFAULT 0,  -- Max 30/day (Gemini 2.0 Flash)
    extra_daily_usage INTEGER NOT NULL DEFAULT 0,   -- Max 45/day (Other Gemini models)
    last_reset_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_requests_today INTEGER GENERATED ALWAYS AS (normal_daily_usage + extra_daily_usage) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_quotas_reset ON public.user_ai_quotas (last_reset_timestamp);
CREATE INDEX IF NOT EXISTS idx_user_quotas_usage ON public.user_ai_quotas (normal_daily_usage, extra_daily_usage);

-- ============================================
-- 2. AI Request Logs Table (for tracking and analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_request_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    request_type VARCHAR(20) NOT NULL CHECK (request_type IN ('normal', 'extra')),
    model_used VARCHAR(50) NOT NULL,
    gemini_key_id VARCHAR(255),  -- ID from the existing gemini_api_keys table
    tokens_used INTEGER,
    response_time_ms INTEGER,
    success BOOLEAN NOT NULL DEFAULT TRUE,
    error_message TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for analytics
CREATE INDEX IF NOT EXISTS idx_ai_logs_user ON public.ai_request_logs (user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_logs_model ON public.ai_request_logs (model_used, timestamp);

-- ============================================
-- 3. Helper Functions
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
        (v_quota.normal_daily_usage >= 30 AND v_quota.extra_daily_usage < 45) AS can_use_extra,
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
        AND extra_daily_usage < 45
        RETURNING TRUE INTO v_success;
    END IF;
    
    RETURN COALESCE(v_success, FALSE);
END;
$$;

-- ============================================
-- 4. Row Level Security
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.user_ai_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_request_logs ENABLE ROW LEVEL SECURITY;

-- User quotas: Users can only see their own quota
CREATE POLICY "Users can view own quota" 
ON public.user_ai_quotas 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Request logs: Users can see their own logs
CREATE POLICY "Users can view own request logs" 
ON public.ai_request_logs 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- ============================================
-- 5. Triggers for automatic timestamp updates
-- ============================================
CREATE TRIGGER update_user_quotas_updated_at
    BEFORE UPDATE ON public.user_ai_quotas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 6. Comments for documentation
-- ============================================
COMMENT ON TABLE public.user_ai_quotas IS 'Tracks daily AI request quotas for users (30 normal + 45 extra)';
COMMENT ON TABLE public.ai_request_logs IS 'Logs all AI requests for analytics and debugging';

COMMENT ON FUNCTION public.get_or_create_user_quota IS 'Gets or creates user quota, handles daily reset';
COMMENT ON FUNCTION public.increment_user_quota IS 'Increments user quota usage (normal or extra)';
