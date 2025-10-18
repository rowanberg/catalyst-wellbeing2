-- Fix all infinite recursion in assessments policies
-- Remove ALL subqueries to profiles table to prevent recursion

BEGIN;

-- Drop ALL policies that might cause recursion
DROP POLICY IF EXISTS "teachers_select_own_assessments" ON public.assessments;
DROP POLICY IF EXISTS "teachers_insert_assessments" ON public.assessments;
DROP POLICY IF EXISTS "teachers_update_own_assessments" ON public.assessments;
DROP POLICY IF EXISTS "teachers_delete_own_assessments" ON public.assessments;
DROP POLICY IF EXISTS "admins_view_school_assessments" ON public.assessments;
DROP POLICY IF EXISTS "students_view_published_assessments" ON public.assessments;
DROP POLICY IF EXISTS "Parents can view their children's assessments" ON public.assessments;
DROP POLICY IF EXISTS "parent_view_child_assessments" ON public.assessments;

-- Create simple policies WITHOUT subqueries to avoid recursion

-- 1. Teachers SELECT: Simple check on teacher_id
CREATE POLICY "teachers_select_own_assessments" ON public.assessments
FOR SELECT 
USING (teacher_id = auth.uid());

-- 2. Teachers INSERT: Simple check on teacher_id
CREATE POLICY "teachers_insert_assessments" ON public.assessments
FOR INSERT 
WITH CHECK (teacher_id = auth.uid());

-- 3. Teachers UPDATE: Simple check on teacher_id
CREATE POLICY "teachers_update_own_assessments" ON public.assessments
FOR UPDATE 
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

-- 4. Teachers DELETE: Simple check on teacher_id
CREATE POLICY "teachers_delete_own_assessments" ON public.assessments
FOR DELETE 
USING (teacher_id = auth.uid());

-- 5. Students SELECT published assessments in their classes
-- Using student_class_assignments table (safe, no recursion)
CREATE POLICY "students_view_published_assessments" ON public.assessments
FOR SELECT 
USING (
    is_published = true 
    AND class_id IN (
        SELECT class_id 
        FROM student_class_assignments 
        WHERE student_id = auth.uid() 
        AND is_active = true
    )
);

COMMIT;

-- Verify policies
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN qual::text LIKE '%profiles%' THEN '⚠️ HAS RECURSION RISK'
        WHEN with_check::text LIKE '%profiles%' THEN '⚠️ HAS RECURSION RISK'
        ELSE '✅ Safe'
    END as safety_check,
    qual::text as using_expression,
    with_check::text as with_check_expression
FROM pg_policies 
WHERE tablename = 'assessments'
ORDER BY cmd, policyname;
