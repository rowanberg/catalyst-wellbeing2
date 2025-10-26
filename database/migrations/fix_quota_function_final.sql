-- Final fix for quota functions - rename output columns to avoid all ambiguity

DROP FUNCTION IF EXISTS public.get_or_create_user_quota(UUID);

CREATE OR REPLACE FUNCTION public.get_or_create_user_quota(input_user_id UUID)
RETURNS TABLE (
    out_user_id UUID,
    out_normal_daily_usage INTEGER,
    out_extra_daily_usage INTEGER,
    out_can_use_normal BOOLEAN,
    out_can_use_extra BOOLEAN,
    out_needs_reset BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_now TIMESTAMPTZ := NOW();
    v_user_id UUID;
    v_normal_daily_usage INTEGER;
    v_extra_daily_usage INTEGER;
    v_last_reset_timestamp TIMESTAMPTZ;
    v_needs_reset BOOLEAN;
BEGIN
    -- Get existing quota or create new one
    INSERT INTO public.user_ai_quotas (user_id)
    VALUES (input_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Get the quota record values
    SELECT 
        uaq.user_id,
        uaq.normal_daily_usage,
        uaq.extra_daily_usage,
        uaq.last_reset_timestamp
    INTO 
        v_user_id,
        v_normal_daily_usage,
        v_extra_daily_usage,
        v_last_reset_timestamp
    FROM public.user_ai_quotas uaq
    WHERE uaq.user_id = input_user_id;
    
    -- Check if daily reset is needed (new day in UTC)
    v_needs_reset := DATE_TRUNC('day', v_now AT TIME ZONE 'UTC') > 
                     DATE_TRUNC('day', v_last_reset_timestamp AT TIME ZONE 'UTC');
    
    -- Reset if needed
    IF v_needs_reset THEN
        UPDATE public.user_ai_quotas uaq
        SET 
            normal_daily_usage = 0,
            extra_daily_usage = 0,
            last_reset_timestamp = v_now,
            updated_at = v_now
        WHERE uaq.user_id = input_user_id;
        
        -- Update variables
        v_normal_daily_usage := 0;
        v_extra_daily_usage := 0;
    END IF;
    
    -- Return the values
    RETURN QUERY SELECT 
        v_user_id,
        v_normal_daily_usage,
        v_extra_daily_usage,
        (v_normal_daily_usage < 30),
        (v_normal_daily_usage >= 30 AND v_extra_daily_usage < 500),
        v_needs_reset;
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
        UPDATE public.user_ai_quotas uaq
        SET 
            normal_daily_usage = uaq.normal_daily_usage + 1,
            updated_at = NOW()
        WHERE uaq.user_id = input_user_id
        AND uaq.normal_daily_usage < 30
        RETURNING TRUE INTO v_success;
    ELSIF input_request_type = 'extra' THEN
        UPDATE public.user_ai_quotas uaq
        SET 
            extra_daily_usage = uaq.extra_daily_usage + 1,
            updated_at = NOW()
        WHERE uaq.user_id = input_user_id
        AND uaq.extra_daily_usage < 500
        RETURNING TRUE INTO v_success;
    END IF;
    
    RETURN COALESCE(v_success, FALSE);
END;
$$;
