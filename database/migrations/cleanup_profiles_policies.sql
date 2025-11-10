-- Clean up profiles RLS policies - remove recursive ones, keep safe ones

-- Drop the RECURSIVE policy (causes infinite loop)
DROP POLICY IF EXISTS "Students can view profiles in their school" ON public.profiles;

-- Drop duplicate "own profile" policies, keep only one
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Keep these two good policies:
-- 1. "Users can view their own profile" - Simple, no recursion ✅
-- 2. "Users can view profiles in their school" - Uses function, should be OK ✅

-- Verify remaining policies
SELECT 
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
AND cmd = 'SELECT'
ORDER BY policyname;
