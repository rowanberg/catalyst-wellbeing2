-- =====================================================
-- AGGRESSIVE FIX - Disable/Re-enable RLS
-- =====================================================
-- This completely resets RLS on assessment_grades
-- =====================================================

BEGIN;

-- Temporarily disable RLS to clear everything
ALTER TABLE public.assessment_grades DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_assessments DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on assessment_grades
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'assessment_grades' AND schemaname = 'public')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.assessment_grades', r.policyname);
    END LOOP;
    
    -- Drop all policies on academic_assessments
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'academic_assessments' AND schemaname = 'public')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.academic_assessments', r.policyname);
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE public.assessment_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_assessments ENABLE ROW LEVEL SECURITY;

-- Create simple non-recursive policies using direct comparison
CREATE POLICY "students_see_own_grades" ON public.assessment_grades
FOR SELECT TO authenticated
USING (
  student_id IN (
    SELECT p.id FROM profiles p WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "teachers_manage_grades" ON public.assessment_grades
FOR ALL TO authenticated
USING (teacher_id = auth.uid());

CREATE POLICY "students_see_own_academic" ON public.academic_assessments
FOR SELECT TO authenticated
USING (
  student_id IN (
    SELECT p.id FROM profiles p WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "teachers_manage_academic" ON public.academic_assessments
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('teacher', 'admin')
  )
);

COMMIT;

-- Verification
SELECT '=== ASSESSMENT_GRADES POLICIES ===' as info;
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'assessment_grades' AND schemaname = 'public';

SELECT '=== ACADEMIC_ASSESSMENTS POLICIES ===' as info;
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'academic_assessments' AND schemaname = 'public';
