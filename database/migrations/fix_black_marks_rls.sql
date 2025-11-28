-- Fix black_marks RLS policies
-- Issue: teacher_id and student_id reference auth.users(id), not profiles.id
-- The RLS policies were incorrectly comparing against profiles.id

-- Fix: Teachers can update their own black marks
DROP POLICY IF EXISTS "Teachers can update their own black marks" ON black_marks;
CREATE POLICY "Teachers can update their own black marks" ON black_marks
  FOR UPDATE USING (
    teacher_id = (select auth.uid())
  );

-- Fix: Students can view their own black marks  
DROP POLICY IF EXISTS "Students can view their own black marks" ON black_marks;
CREATE POLICY "Students can view their own black marks" ON black_marks
  FOR SELECT USING (
    student_id = (select auth.uid())
  );

-- Fix: Students can update their response
DROP POLICY IF EXISTS "Students can update their response" ON black_marks;
CREATE POLICY "Students can update their response" ON black_marks
  FOR UPDATE USING (
    student_id = (select auth.uid())
  );

SELECT 'Black marks RLS policies fixed - teacher_id and student_id now correctly reference auth.uid()' as status;
