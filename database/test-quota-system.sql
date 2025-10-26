-- Test AI Quota System
-- Run this in Supabase SQL Editor to verify everything works

-- 1. Check if tables exist
SELECT 'Tables exist:' as test;
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('user_ai_quotas', 'ai_request_logs')
ORDER BY table_name;

-- 2. Check if functions exist
SELECT 'Functions exist:' as test;
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('get_or_create_user_quota', 'increment_user_quota')
ORDER BY routine_name;

-- 3. Test creating a quota for the current user
SELECT 'Testing quota creation:' as test;
SELECT * FROM get_or_create_user_quota(auth.uid());

-- 4. Check if quota was created
SELECT 'Quota record:' as test;
SELECT * FROM user_ai_quotas WHERE user_id = auth.uid();

-- 5. Test incrementing normal quota
SELECT 'Testing increment:' as test;
SELECT increment_user_quota(auth.uid(), 'normal');

-- 6. Check updated quota
SELECT 'Updated quota:' as test;
SELECT * FROM user_ai_quotas WHERE user_id = auth.uid();

-- If any of these fail, you'll see the error
-- If all succeed, the quota system is working correctly!
