-- Critical fix: Allow users to view their OWN profile
-- Without this, students can't even authenticate properly

-- Drop if exists
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create policy to allow users to view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- Verify the policy was created
SELECT 
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
AND policyname = 'Users can view their own profile';
