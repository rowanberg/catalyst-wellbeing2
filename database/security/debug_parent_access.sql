-- ============================================================================
-- Debug Parent Access Issues
-- Run this to diagnose why parents still get 401 errors
-- ============================================================================

-- 1. Check if parent has any children in the system
SELECT 
    'Parent-Child Relationships' as check_name,
    COUNT(*) as count
FROM parent_child_relationships;

-- 2. Verify RLS is enabled on community_posts
SELECT 
    'RLS Status' as check_name,
    tablename,
    rowsecurity as enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'community_posts';

-- 3. List all policies on community_posts
SELECT 
    'community_posts policies' as info,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'community_posts'
ORDER BY policyname;

-- 4. Check if the specific parent policy exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'community_posts'
            AND policyname = 'Parents can view posts for their children''s school'
        ) 
        THEN '✅ Parent policy EXISTS on community_posts'
        ELSE '❌ Parent policy MISSING on community_posts'
    END as policy_status;

-- 5. Check post_reactions policies
SELECT 
    'post_reactions policies' as info,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'post_reactions'
ORDER BY policyname;

-- 6. Test query: Can we see any community posts at all?
SELECT 
    'Total community posts' as info,
    COUNT(*) as count,
    COUNT(CASE WHEN visibility = 'all_parents' THEN 1 END) as all_parents_count,
    COUNT(CASE WHEN visibility = 'class_parents' THEN 1 END) as class_parents_count
FROM community_posts;

-- 7. Check if there are any policies that might be blocking access
SELECT 
    'Potentially blocking policies' as info,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('community_posts', 'profiles', 'parent_child_relationships')
AND cmd = 'SELECT'
ORDER BY tablename, policyname;

-- 8. Verify profiles table has user_id column
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
AND column_name IN ('id', 'user_id', 'school_id', 'role')
ORDER BY column_name;
