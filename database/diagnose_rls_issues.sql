-- =====================================================
-- STEP 1: Extract ALL your existing RLS policies
-- =====================================================
-- Run this first to see what policies you actually have

SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND (
    qual LIKE '%auth.uid()%' 
    OR with_check LIKE '%auth.uid()%'
)
AND (
    qual NOT LIKE '%(SELECT auth.uid())%'
    OR with_check NOT LIKE '%(SELECT auth.uid())%'
)
ORDER BY tablename, policyname;

-- =====================================================
-- STEP 2: See the exact definitions
-- =====================================================
-- This shows the complete CREATE POLICY statements

SELECT 
    tablename,
    policyname,
    'DROP POLICY IF EXISTS "' || policyname || '" ON public.' || tablename || ';' || E'\n' ||
    'CREATE POLICY "' || policyname || '" ON public.' || tablename || E'\n' ||
    'FOR ' || cmd || ' ' ||
    CASE 
        WHEN qual IS NOT NULL THEN 'USING (' || qual || ')' 
        ELSE '' 
    END ||
    CASE 
        WHEN with_check IS NOT NULL THEN E'\nWITH CHECK (' || with_check || ')' 
        ELSE '' 
    END || ';' as policy_definition
FROM pg_policies
WHERE schemaname = 'public'
AND (
    qual LIKE '%auth.uid()%' 
    OR with_check LIKE '%auth.uid()%'
)
ORDER BY tablename, policyname;
