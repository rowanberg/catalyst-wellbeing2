-- Secure RLS policies for profiles table without infinite recursion
-- This uses a SECURITY DEFINER function to break the recursion

-- Step 1: Create a function to get user's school_id that bypasses RLS
CREATE OR REPLACE FUNCTION public.get_user_school_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT school_id FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Step 2: Create a function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  );
$$;

-- Step 3: Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop any existing problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles in their school" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles in their school" ON profiles;
DROP POLICY IF EXISTS "View profiles by school" ON profiles;
DROP POLICY IF EXISTS "View profiles in same school" ON profiles;

-- Step 5: Create secure non-recursive policies
CREATE POLICY "Users can view their own profile"
ON profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can view profiles in their school"
ON profiles
FOR SELECT
TO authenticated
USING (school_id = public.get_user_school_id());

CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can insert profiles in their school"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin() = true
  AND school_id = public.get_user_school_id()
);

CREATE POLICY "Admins can update profiles in their school"
ON profiles
FOR UPDATE
TO authenticated
USING (
  public.is_admin() = true
  AND school_id = public.get_user_school_id()
);

-- Step 6: Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Step 7: Test that RLS is working
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';
