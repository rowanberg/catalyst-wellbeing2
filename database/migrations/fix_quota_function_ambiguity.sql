-- Fix ambiguous column reference in quota functions

-- Drop and recreate the function with renamed parameter to avoid ambiguity
DROP FUNCTION IF EXISTS public.get_or_create_user_quota(UUID);

CREATE OR REPLACE FUNCTION public.get_or_create_user_quota(input_user_id UUID)
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
    VALUES (input_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Get the quota record
    SELECT * INTO v_quota 
    FROM public.user_ai_quotas 
    WHERE user_ai_quotas.user_id = input_user_id;
    
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
        WHERE user_ai_quotas.user_id = input_user_id;
        
        -- Refresh the record
        SELECT * INTO v_quota 
        FROM public.user_ai_quotas 
        WHERE user_ai_quotas.user_id = input_user_id;
    END IF;
    
    RETURN QUERY SELECT 
        v_quota.user_id::UUID,
        v_quota.normal_daily_usage::INTEGER,
        v_quota.extra_daily_usage::INTEGER,
        (v_quota.normal_daily_usage < 30)::BOOLEAN,
        (v_quota.normal_daily_usage >= 30 AND v_quota.extra_daily_usage < 500)::BOOLEAN,
        v_needs_reset::BOOLEAN;
END;
$$;

-- Also fix increment_user_quota function
DROP FUNCTION IF EXISTS public.increment_user_quota(UUID, VARCHAR);

CREATE OR REPLACE FUNCTION public.increment_user_quota(
    input_user_id UUID,
    input_request_type VARCHAR(20)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_success BOOLEAN := FALSE;
BEGIN
    IF input_request_type = 'normal' THEN
        UPDATE public.user_ai_quotas
        SET normal_daily_usage = normal_daily_usage + 1,
            updated_at = NOW()
        WHERE user_ai_quotas.user_id = input_user_id
        AND normal_daily_usage < 30
        RETURNING TRUE INTO v_success;
    ELSIF input_request_type = 'extra' THEN
        UPDATE public.user_ai_quotas
        SET extra_daily_usage = extra_daily_usage + 1,
            updated_at = NOW()
        WHERE user_ai_quotas.user_id = input_user_id
        AND extra_daily_usage < 500
        RETURNING TRUE INTO v_success;
    END IF;
    
    RETURN COALESCE(v_success, FALSE);
END;
$$;
