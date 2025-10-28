-- =====================================================
-- COMPLETE RLS FIX - DROP ALL CONFLICTING POLICIES
-- =====================================================

BEGIN;

-- Drop ALL policies on assessment_grades
DROP POLICY IF EXISTS "Students can view own grades" ON public.assessment_grades;
DROP POLICY IF EXISTS "Students can view their own grades" ON public.assessment_grades;
DROP POLICY IF EXISTS "Students view own grades simple" ON public.assessment_grades;
DROP POLICY IF EXISTS "Parents can view children grades" ON public.assessment_grades;
DROP POLICY IF EXISTS "Parents can view their children's grades" ON public.assessment_grades;

-- Drop ALL policies on academic_assessments
DROP POLICY IF EXISTS "Students can view own assessments" ON public.academic_assessments;
DROP POLICY IF EXISTS "Students view own assessments simple" ON public.academic_assessments;

-- Create SINGLE simple policy for assessment_grades
CREATE POLICY "student_read_own_grades" ON public.assessment_grades
FOR SELECT TO authenticated
USING (
  student_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
);

-- Create SINGLE simple policy for academic_assessments  
CREATE POLICY "student_read_own_academic" ON public.academic_assessments
FOR SELECT TO authenticated
USING (
  student_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
);

COMMIT;

-- Verify
SELECT 'assessment_grades policies:' as info;
SELECT policyname FROM pg_policies 
WHERE tablename = 'assessment_grades' AND policyname LIKE '%student%';

SELECT 'academic_assessments policies:' as info;
SELECT policyname FROM pg_policies 
WHERE tablename = 'academic_assessments' AND policyname LIKE '%student%';
