-- ============================================================================
-- FULL DIAGNOSTIC - Find the root cause
-- ============================================================================

-- 1. Check if parent policies were created
SELECT '=== POLICIES CHECK ===' as step;
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('community_posts', 'post_reactions', 'attendance', 'assessments')
GROUP BY tablename
ORDER BY tablename;

-- 2. Check parent-child relationships
SELECT '=== PARENT-CHILD RELATIONSHIPS ===' as step;
SELECT 
    COUNT(*) as total_relationships,
    COUNT(DISTINCT parent_id) as unique_parents,
    COUNT(DISTINCT child_id) as unique_children
FROM parent_child_relationships;

-- 3. Sample parent-child data
SELECT '=== SAMPLE RELATIONSHIPS ===' as step;
SELECT 
    pcr.id,
    pp.role as parent_role,
    pp.first_name || ' ' || pp.last_name as parent_name,
    cp.role as child_role,
    cp.first_name || ' ' || cp.last_name as child_name,
    cp.school_id
FROM parent_child_relationships pcr
JOIN profiles pp ON pp.id = pcr.parent_id
JOIN profiles cp ON cp.id = pcr.child_id
LIMIT 3;

-- 4. Check community posts
SELECT '=== COMMUNITY POSTS ===' as step;
SELECT 
    COUNT(*) as total_posts,
    COUNT(CASE WHEN visibility = 'all_parents' THEN 1 END) as all_parents_posts,
    COUNT(DISTINCT school_id) as schools_with_posts
FROM community_posts;

-- 5. List ALL policies on community_posts
SELECT '=== ALL COMMUNITY_POSTS POLICIES ===' as step;
SELECT 
    policyname,
    cmd,
    CASE WHEN qual IS NULL THEN 'No USING clause' ELSE 'Has USING clause' END as has_using
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'community_posts'
ORDER BY policyname;

-- 6. Check if there are RESTRICTIVE policies blocking access
SELECT '=== RESTRICTIVE POLICIES CHECK ===' as step;
SELECT 
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('community_posts', 'profiles')
AND permissive = 'RESTRICTIVE'
ORDER BY tablename;

-- 7. Final verdict
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'community_posts' AND policyname LIKE '%parent%') > 0
        THEN '✅ Parent policies exist'
        ELSE '❌ NO parent policies found - policies failed to create!'
    END as diagnosis;
