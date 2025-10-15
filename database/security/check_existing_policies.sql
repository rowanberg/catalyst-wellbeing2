-- Check existing RLS policies on key tables
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
    'community_posts',
    'post_reactions',
    'attendance',
    'assessments',
    'assessment_grades',
    'parent_child_relationships'
)
ORDER BY tablename, policyname;
