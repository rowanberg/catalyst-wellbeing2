-- ============================================
-- Apply This Migration to Fix Quota System
-- ============================================
-- Copy and paste this entire file into Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/fsvuhhticbfjftnwzsue/sql/new

-- Drop existing functions
DROP FUNCTION IF EXISTS public.get_or_create_user_quota(UUID);
DROP FUNCTION IF EXISTS public.increment_user_quota(UUID, VARCHAR);

-- Recreate get_or_create_user_quota with updated limits (30 + 45)
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
    v_quota RECORD;
    v_needs_reset BOOLEAN := FALSE;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    -- Get existing quota
    SELECT * INTO v_quota 
    FROM public.user_ai_quotas 
    WHERE user_ai_quotas.user_id = input_user_id;
    
    -- If no quota exists, create one
    IF NOT FOUND THEN
        INSERT INTO public.user_ai_quotas (user_id, normal_daily_usage, extra_daily_usage, last_reset_timestamp)
        VALUES (input_user_id, 0, 0, v_now)
        RETURNING * INTO v_quota;
        
        v_needs_reset := FALSE;
    ELSE
        -- Check if we need to reset (more than 24 hours since last reset)
        v_needs_reset := (v_now - v_quota.last_reset_timestamp) >= INTERVAL '24 hours';
        
        -- Reset if needed
        IF v_needs_reset THEN
            UPDATE public.user_ai_quotas
            SET 
                normal_daily_usage = 0,
                extra_daily_usage = 0,
                last_reset_timestamp = v_now,
                updated_at = v_now
            WHERE user_ai_quotas.user_id = input_user_id;
            
            -- Refresh the record
            SELECT * INTO v_quota 
            FROM public.user_ai_quotas 
            WHERE user_ai_quotas.user_id = input_user_id;
        END IF;
    END IF;
    
    -- Return quota status with updated 45 limit
    RETURN QUERY SELECT 
        v_quota.user_id::UUID,
        v_quota.normal_daily_usage::INTEGER,
        v_quota.extra_daily_usage::INTEGER,
        (v_quota.normal_daily_usage < 30)::BOOLEAN,
        (v_quota.normal_daily_usage >= 30 AND v_quota.extra_daily_usage < 45)::BOOLEAN,
        v_needs_reset::BOOLEAN;
END;
$$;

-- Recreate increment_user_quota with correct parameter name
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
        SET 
            normal_daily_usage = normal_daily_usage + 1,
            updated_at = NOW()
        WHERE user_id = input_user_id
        AND normal_daily_usage < 30
        RETURNING TRUE INTO v_success;
    ELSIF input_request_type = 'extra' THEN
        UPDATE public.user_ai_quotas
        SET 
            extra_daily_usage = extra_daily_usage + 1,
            updated_at = NOW()
        WHERE user_id = input_user_id
        AND extra_daily_usage < 45
        RETURNING TRUE INTO v_success;
    END IF;
    
    RETURN COALESCE(v_success, FALSE);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_or_create_user_quota(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_user_quota(UUID, VARCHAR) TO authenticated;

-- Verify the migration
SELECT 'Migration complete! Functions created successfully.' as status;
