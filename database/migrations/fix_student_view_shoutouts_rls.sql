-- Fix RLS policy to allow students to view public shout-outs from their school

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Students can view public shout-outs in their school" ON public.student_shout_outs;

-- Create new policy for students to view public shout-outs
CREATE POLICY "Students can view public shout-outs in their school" 
ON public.student_shout_outs
FOR SELECT
TO authenticated
USING (
  -- Allow if shout-out is public AND user is a student in the same school
  is_public = true 
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'student'
    AND profiles.school_id = student_shout_outs.school_id
  )
);

-- Also ensure RLS is enabled
ALTER TABLE public.student_shout_outs ENABLE ROW LEVEL SECURITY;

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'student_shout_outs'
ORDER BY policyname;
