-- Check and fix RLS on mood_tracking table

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'mood_tracking';

-- Check existing policies
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'mood_tracking';

-- Add admin policy to view all mood tracking data in their school
CREATE POLICY "Admins can view mood tracking in their school"
ON mood_tracking
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT user_id FROM profiles
    WHERE school_id = public.get_user_school_id()
  )
);

-- Verify the policy
SELECT policyname FROM pg_policies 
WHERE tablename = 'mood_tracking'
AND policyname = 'Admins can view mood tracking in their school';
