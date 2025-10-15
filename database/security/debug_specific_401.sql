-- ============================================================================
-- Debug Specific 401 Error for Student ID: 303d5dd0-114c-4978-b89c-229fad7c9804
-- ============================================================================

-- 1. Check if this student exists
SELECT 
    '1. Student Profile Check' as step,
    id,
    first_name,
    last_name,
    role,
    school_id
FROM profiles
WHERE id = '303d5dd0-114c-4978-b89c-229fad7c9804';

-- 2. Check ALL parent-child relationships in the system
SELECT 
    '2. All Parent-Child Relationships' as step,
    pcr.id,
    pp.first_name || ' ' || pp.last_name as parent_name,
    pp.user_id as parent_auth_id,
    cp.first_name || ' ' || cp.last_name as child_name,
    pcr.child_id
FROM parent_child_relationships pcr
JOIN profiles pp ON pp.id = pcr.parent_id
JOIN profiles cp ON cp.id = pcr.child_id;

-- 3. Check if THIS specific child has a parent relationship
SELECT 
    '3. Parent for Student 303d5dd0' as step,
    pcr.id as relationship_id,
    pcr.parent_id,
    pp.user_id as parent_auth_user_id,
    pp.first_name || ' ' || pp.last_name as parent_name,
    pp.role as parent_role
FROM parent_child_relationships pcr
JOIN profiles pp ON pp.id = pcr.parent_id
WHERE pcr.child_id = '303d5dd0-114c-4978-b89c-229fad7c9804';

-- 4. Check if parent policies were created on community_posts
SELECT 
    '4. Community Posts Policies' as step,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'community_posts'
ORDER BY policyname;

-- 5. If NO parent-child relationship exists, we need to create one
-- This is likely the issue!
SELECT 
    '5. Diagnosis' as step,
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM parent_child_relationships 
            WHERE child_id = '303d5dd0-114c-4978-b89c-229fad7c9804'
        ) 
        THEN '❌ NO PARENT-CHILD RELATIONSHIP EXISTS for this student! This is why you get 401.'
        ELSE '✅ Relationship exists - check if policies are correct'
    END as diagnosis;
