-- Check current RLS policies on assessments table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual::text as using_expression,
    with_check::text as with_check_expression
FROM pg_policies 
WHERE tablename = 'assessments'
ORDER BY cmd, policyname;

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'assessments';

-- Check assessments table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'assessments'
ORDER BY ordinal_position;
