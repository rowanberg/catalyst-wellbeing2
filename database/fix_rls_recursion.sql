-- =====================================================
-- FIX INFINITE RECURSION IN RLS POLICIES
-- =====================================================
-- Remove the problematic recursive policies
-- Replace with simple, non-recursive versions
-- =====================================================

BEGIN;

-- Fix assessment_grades - use profile.id directly
DROP POLICY IF EXISTS "Students can view own grades" ON public.assessment_grades;
DROP POLICY IF EXISTS "Students can view their own grades" ON public.assessment_grades;

CREATE POLICY "Students view own grades simple" ON public.assessment_grades
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = assessment_grades.student_id 
    AND profiles.user_id = auth.uid()
  )
);

-- Fix academic_assessments - same pattern
DROP POLICY IF EXISTS "Students can view own assessments" ON public.academic_assessments;

CREATE POLICY "Students view own assessments simple" ON public.academic_assessments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = academic_assessments.student_id 
    AND profiles.user_id = auth.uid()
  )
);

-- Add policy for students to view assessments they have grades for
DROP POLICY IF EXISTS "Students can view their graded assessments" ON public.assessments;

CREATE POLICY "Students view published assessments" ON public.assessments
FOR SELECT USING (
  is_published = true
  OR id IN (
    SELECT ag.assessment_id 
    FROM assessment_grades ag
    JOIN profiles p ON p.id = ag.student_id
    WHERE p.user_id = auth.uid()
  )
);

COMMIT;
