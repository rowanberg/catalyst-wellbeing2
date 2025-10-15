-- ============================================================================
-- Test Single Policy to Find Error Source
-- ============================================================================

-- First, check if profiles table has user_id column
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
AND column_name = 'user_id';

-- Check if parent_child_relationships exists
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'parent_child_relationships'
);

-- Test creating just the attendance policy
CREATE POLICY "Parents can view their children's attendance_test" ON public.attendance
FOR SELECT TO authenticated
USING (
    student_id IN (
        SELECT pcr.child_id 
        FROM public.parent_child_relationships pcr
        WHERE pcr.parent_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    )
);
