-- Fix Row Level Security for seat_assignments table
-- Students need to be able to read their own seat assignments

-- Option 1: Simple - Allow all authenticated users to read seat assignments
CREATE POLICY "Students can view seat assignments"
ON seat_assignments
FOR SELECT
TO authenticated
USING (true);

-- Option 2: More secure - Students can only see their own seat
-- (Uncomment this and comment Option 1 if you want more security)
/*
CREATE POLICY "Students can view their own seat"
ON seat_assignments
FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);
*/

-- Verify RLS is enabled
SELECT 
  'RLS Status:' as info,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'seat_assignments';

-- Check existing policies
SELECT 
  'Existing Policies:' as info,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'seat_assignments';
