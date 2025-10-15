-- ============================================================================
-- Test Authentication Flow for Parent Portal
-- Run this with the SAME user credentials you use in the Parent Portal
-- ============================================================================

-- Replace 'YOUR_AUTH_USER_ID' with the actual auth.users.id from your session
-- Get this from: SELECT auth.uid() when logged in as parent

-- STEP 1: Find your parent profile
SELECT 
    'Your Parent Profile' as info,
    id as profile_id,
    user_id,
    role,
    first_name || ' ' || last_name as name,
    school_id
FROM profiles
-- WHERE user_id = 'YOUR_AUTH_USER_ID_HERE'
WHERE role = 'parent'
LIMIT 1;

-- STEP 2: Check your children
SELECT 
    'Your Children' as info,
    pcr.id as relationship_id,
    cp.id as child_profile_id,
    cp.first_name || ' ' || cp.last_name as child_name,
    cp.school_id
FROM parent_child_relationships pcr
JOIN profiles pp ON pp.id = pcr.parent_id
JOIN profiles cp ON cp.id = pcr.child_id
WHERE pp.role = 'parent'
-- AND pp.user_id = 'YOUR_AUTH_USER_ID_HERE'
LIMIT 3;

-- STEP 3: Test if you can see community posts
SELECT 
    'Community Posts You Should See' as info,
    cp.id,
    cp.title,
    cp.visibility,
    cp.school_id
FROM community_posts cp
WHERE cp.school_id IN (
    SELECT child_prof.school_id
    FROM parent_child_relationships pcr
    JOIN profiles parent_prof ON parent_prof.id = pcr.parent_id
    JOIN profiles child_prof ON child_prof.id = pcr.child_id
    WHERE parent_prof.role = 'parent'
    -- AND parent_prof.user_id = 'YOUR_AUTH_USER_ID_HERE'
)
ORDER BY cp.created_at DESC
LIMIT 5;
