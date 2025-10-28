-- =====================================================
-- FIX ASSESSMENT RLS POLICIES FOR STUDENTS
-- =====================================================
-- The issue: RLS policies check student_id = auth.uid()
-- But student_id is the profile ID, not the user_id
-- We need to join through profiles table
-- =====================================================

BEGIN;

-- Fix academic_assessments policies
DROP POLICY IF EXISTS "Students can view own assessments" ON public.academic_assessments;
CREATE POLICY "Students can view own assessments" ON public.academic_assessments
FOR SELECT USING (
  student_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

-- Fix assessment_grades policies
DROP POLICY IF EXISTS "Students can view own grades" ON public.assessment_grades;
CREATE POLICY "Students can view own grades" ON public.assessment_grades
FOR SELECT USING (
  student_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Students can view their own grades" ON public.assessment_grades;
CREATE POLICY "Students can view their own grades" ON public.assessment_grades
FOR SELECT USING (
  student_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'academic_assessments policies:' AS info;
SELECT policyname, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'academic_assessments' 
AND policyname LIKE '%student%';

SELECT 'assessment_grades policies:' AS info;
SELECT policyname, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'assessment_grades' 
AND policyname LIKE '%student%';
