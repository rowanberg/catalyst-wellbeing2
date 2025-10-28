-- =====================================================
-- FIX: Allow Students to View Their Assessments
-- =====================================================
-- Students need to see assessments they have grades for
-- This is required for the PDF report card generation
-- =====================================================

BEGIN;

-- Drop existing student policy if it exists
DROP POLICY IF EXISTS "Students can view their graded assessments" ON public.assessments;

-- Create policy allowing students to view assessments they have grades for
CREATE POLICY "Students can view their graded assessments" ON public.assessments
FOR SELECT USING (
  id IN (
    SELECT assessment_id 
    FROM assessment_grades 
    WHERE student_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'Assessments policies for students:' AS info;
SELECT policyname, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'assessments' 
AND policyname LIKE '%student%';
