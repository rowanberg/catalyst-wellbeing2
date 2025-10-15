-- ============================================================================
-- Debug Auth Mismatch - Why is the API failing the relationship check?
-- ============================================================================

-- 1. Show ALL parent-child relationships
SELECT 
    '=== ALL RELATIONSHIPS ===' as info,
    pcr.id,
    pcr.parent_id,
    pp.user_id as parent_auth_user_id,
    pp.first_name || ' ' || pp.last_name as parent_name,
    pp.role as parent_role,
    pcr.child_id,
    cp.first_name || ' ' || cp.last_name as child_name
FROM parent_child_relationships pcr
JOIN profiles pp ON pp.id = pcr.parent_id
JOIN profiles cp ON cp.id = pcr.child_id
ORDER BY pcr.created_at DESC;

-- 2. Check the specific student
SELECT 
    '=== SPECIFIC STUDENT ===' as info,
    id,
    user_id,
    first_name || ' ' || last_name as name,
    role,
    school_id
FROM profiles
WHERE id = '303d5dd0-114c-4978-b89c-229fad7c9804';

-- 3. Check who the logged-in parent is (find by role)
SELECT 
    '=== PARENT PROFILES ===' as info,
    id as profile_id,
    user_id as auth_user_id,
    first_name || ' ' || last_name as name,
    role,
    email
FROM profiles
WHERE role = 'parent'
ORDER BY created_at DESC;

-- 4. Check RLS policies on parent_child_relationships
SELECT 
    '=== RLS POLICIES ON parent_child_relationships ===' as info,
    policyname,
    cmd,
    roles,
    permissive
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'parent_child_relationships'
ORDER BY policyname;

-- 5. Critical Check: Can the API actually READ parent_child_relationships?
-- If RLS is too restrictive, the API can't find the relationship even if it exists
SELECT 
    '=== RLS STATUS ===' as info,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'parent_child_relationships';

-- 6. Test query: Simulate what the API is doing
-- Replace 'YOUR_PARENT_PROFILE_ID' with the actual parent profile.id
/*
SELECT 
    '=== SIMULATED API QUERY ===' as info,
    id
FROM parent_child_relationships
WHERE parent_id = 'YOUR_PARENT_PROFILE_ID'  -- Replace this
AND child_id = '303d5dd0-114c-4978-b89c-229fad7c9804';
*/
