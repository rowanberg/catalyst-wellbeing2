-- Fix RLS policies for student_shout_outs table
-- Allow teachers to insert and view shout-outs

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Teachers can insert shout-outs" ON public.student_shout_outs;
DROP POLICY IF EXISTS "Teachers can view their shout-outs" ON public.student_shout_outs;
DROP POLICY IF EXISTS "Students can view their shout-outs" ON public.student_shout_outs;
DROP POLICY IF EXISTS "Admins can view all shout-outs in their school" ON public.student_shout_outs;

-- Enable RLS on student_shout_outs table
ALTER TABLE public.student_shout_outs ENABLE ROW LEVEL SECURITY;

-- Policy: Teachers can insert shout-outs for students in their school
CREATE POLICY "Teachers can insert shout-outs" ON public.student_shout_outs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'teacher'
      AND profiles.school_id = student_shout_outs.school_id
    )
  );

-- Policy: Teachers can view shout-outs they created
CREATE POLICY "Teachers can view their shout-outs" ON public.student_shout_outs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'teacher'
      AND profiles.id = student_shout_outs.teacher_id
    )
  );

-- Policy: Students can view shout-outs sent to them
CREATE POLICY "Students can view their shout-outs" ON public.student_shout_outs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'student'
      AND profiles.id = student_shout_outs.student_id
    )
  );

-- Policy: Admins can view all shout-outs in their school
CREATE POLICY "Admins can view all shout-outs in their school" ON public.student_shout_outs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.school_id = student_shout_outs.school_id
    )
  );

-- Policy: Teachers can update their own shout-outs
CREATE POLICY "Teachers can update their shout-outs" ON public.student_shout_outs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'teacher'
      AND profiles.id = student_shout_outs.teacher_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'teacher'
      AND profiles.id = student_shout_outs.teacher_id
    )
  );

-- Policy: Teachers can delete their own shout-outs
CREATE POLICY "Teachers can delete their shout-outs" ON public.student_shout_outs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'teacher'
      AND profiles.id = student_shout_outs.teacher_id
    )
  );
