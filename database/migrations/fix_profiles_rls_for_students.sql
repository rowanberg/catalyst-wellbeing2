-- Allow students to view basic profile info of other students/teachers in their school
-- This is needed so students can see names in shout-outs

-- Drop if exists
DROP POLICY IF EXISTS "Students can view profiles in their school" ON public.profiles;

-- Create policy to allow students to view basic profile info within their school
CREATE POLICY "Students can view profiles in their school" 
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Allow students to view profiles of people in their school
  EXISTS (
    SELECT 1 FROM public.profiles viewer
    WHERE viewer.user_id = auth.uid()
    AND viewer.role = 'student'
    AND viewer.school_id = profiles.school_id
  )
);

-- Verify the policy was created
SELECT 
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
AND policyname = 'Students can view profiles in their school';
