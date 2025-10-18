-- Fix infinite recursion in assessments policies
-- Use simpler policies without subqueries to profiles table

BEGIN;

-- Drop the problematic policy
DROP POLICY IF EXISTS "teachers_insert_assessments" ON public.assessments;

-- Create simpler INSERT policy without recursion
-- Just check that teacher_id matches auth.uid()
CREATE POLICY "teachers_insert_assessments" ON public.assessments
FOR INSERT 
WITH CHECK (teacher_id = auth.uid());

COMMIT;

-- Verify the fix
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual::text as using_expression,
    with_check::text as with_check_expression
FROM pg_policies 
WHERE tablename = 'assessments' AND policyname = 'teachers_insert_assessments';
