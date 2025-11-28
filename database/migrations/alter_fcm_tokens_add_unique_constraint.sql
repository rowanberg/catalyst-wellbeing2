-- Migration to add composite unique constraint to existing fcm_tokens table
-- Run this if the table already exists

-- First, clean up any duplicates (keep most recent token per user per device_type)
WITH ranked_tokens AS (
    SELECT 
        id,
        user_id,
        device_type,
        ROW_NUMBER() OVER (
            PARTITION BY user_id, device_type 
            ORDER BY last_used_at DESC, created_at DESC
        ) as rn
    FROM public.fcm_tokens
)
DELETE FROM public.fcm_tokens
WHERE id IN (
    SELECT id 
    FROM ranked_tokens 
    WHERE rn > 1
);

-- Drop the existing constraint if it exists (in case of retry)
ALTER TABLE public.fcm_tokens DROP CONSTRAINT IF EXISTS unique_user_device;

-- Add the composite unique constraint
ALTER TABLE public.fcm_tokens 
ADD CONSTRAINT unique_user_device UNIQUE (user_id, device_type);

-- Update table comment
COMMENT ON TABLE public.fcm_tokens IS 'Stores Firebase Cloud Messaging tokens for push notifications. One token per device type per user.';
COMMENT ON CONSTRAINT unique_user_device ON public.fcm_tokens IS 'Ensures one FCM token per device type per user';

-- Report final state
SELECT 
    COUNT(*) as total_tokens,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT (user_id, device_type)) as unique_user_devices
FROM public.fcm_tokens;

SELECT '✅ Composite unique constraint added successfully! Duplicates cleaned up.' as status;
