-- Fix ALL student shout-out RLS policies to use correct user_id checks
-- Run this in Supabase SQL Editor

-- 1. Drop the buggy "Public shout-outs visible to school community" policy
DROP POLICY IF EXISTS "Public shout-outs visible to school community" ON public.student_shout_outs;

-- 2. Drop the buggy "Students can view shout-outs about themselves" policy  
DROP POLICY IF EXISTS "Students can view shout-outs about themselves" ON public.student_shout_outs;

-- 3. Recreate them with CORRECT checks
-- This policy allows ALL school members to see public shout-outs
CREATE POLICY "Public shout-outs visible to school community" 
ON public.student_shout_outs
FOR SELECT
TO authenticated
USING (
  is_public = true 
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()  -- ✅ FIXED: use user_id not id
    AND profiles.school_id = student_shout_outs.school_id
  )
);

-- This policy allows students to see their own shout-outs (even if private)
CREATE POLICY "Students can view shout-outs about themselves" 
ON public.student_shout_outs
FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT id FROM public.profiles 
    WHERE profiles.user_id = auth.uid()  -- ✅ FIXED: use user_id to get profile.id
    AND profiles.role = 'student'
  )
);

-- Verify all policies
SELECT 
  policyname,
  cmd,
  roles,
  CASE 
    WHEN qual LIKE '%user_id = auth.uid%' THEN '✅ CORRECT'
    WHEN qual LIKE '%id = auth.uid%' OR qual LIKE '%id = ( SELECT auth.uid%' THEN '❌ BUGGY'
    ELSE '⚠️  CHECK'
  END as status,
  qual
FROM pg_policies
WHERE tablename = 'student_shout_outs'
AND cmd = 'SELECT'
ORDER BY policyname;
