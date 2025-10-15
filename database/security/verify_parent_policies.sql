-- Verify parent access policies were created successfully
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND (
    policyname LIKE '%parent%' 
    OR policyname LIKE '%children%'
)
ORDER BY tablename, policyname;

-- Check specific tables
SELECT 
    'community_posts' as table_name,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'community_posts'
AND policyname LIKE '%parent%'

UNION ALL

SELECT 
    'post_reactions' as table_name,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'post_reactions'
AND policyname LIKE '%parent%'

UNION ALL

SELECT 
    'attendance' as table_name,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'attendance'
AND policyname LIKE '%parent%';

-- Check if RLS is enabled on critical tables
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('community_posts', 'post_reactions', 'attendance', 'assessments')
ORDER BY tablename;
