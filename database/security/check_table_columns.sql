-- ============================================================================
-- Check Table Columns Before Creating Policies
-- Purpose: Verify table structures to identify column mismatches
-- Date: 2025-10-15
-- ============================================================================

-- Check if tables exist and their columns
SELECT 
    t.table_name,
    array_agg(c.column_name ORDER BY c.ordinal_position) as columns
FROM information_schema.tables t
JOIN information_schema.columns c ON c.table_name = t.table_name AND c.table_schema = t.table_schema
WHERE t.table_schema = 'public'
AND t.table_name IN (
    'profiles',
    'attendance', 
    'assessments',
    'assessment_grades',
    'community_posts',
    'post_reactions',
    'parent_notifications',
    'student_wallets',
    'student_achievements',
    'performance_benchmarks',
    'student_messages',
    'classes',
    'student_class_assignments',
    'parent_child_relationships'
)
GROUP BY t.table_name
ORDER BY t.table_name;

-- Specifically check profiles table structure
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check parent_child_relationships structure  
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'parent_child_relationships'
ORDER BY ordinal_position;

-- Check post_reactions structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'post_reactions'
ORDER BY ordinal_position;
