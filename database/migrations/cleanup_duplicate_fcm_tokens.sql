-- Cleanup script to remove duplicate FCM tokens
-- Run this AFTER creating the fcm_tokens table if you have existing duplicate tokens

-- This will keep only the most recent token for each (user_id, device_type) combination
-- and delete the older duplicates

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

-- Report how many tokens remain
SELECT 
    COUNT(*) as total_tokens,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT (user_id, device_type)) as unique_user_devices
FROM public.fcm_tokens;

SELECT 'Duplicate FCM tokens cleaned up successfully' as status;
