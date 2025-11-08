-- Fix ALL Row Level Security policies for seating feature
-- Students need to read: seat_assignments, seating_charts, and classes

-- 1. Allow students to view seating charts
DROP POLICY IF EXISTS "Students can view seating charts" ON seating_charts;
CREATE POLICY "Students can view seating charts"
ON seating_charts
FOR SELECT
TO authenticated
USING (true);

-- 2. Allow students to view classes
DROP POLICY IF EXISTS "Students can view classes" ON classes;
CREATE POLICY "Students can view classes"
ON classes
FOR SELECT
TO authenticated
USING (true);

-- 3. Verify all policies are active
SELECT 
  'Seating Permissions Summary:' as info,
  tablename,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename IN ('seat_assignments', 'seating_charts', 'classes')
ORDER BY tablename, policyname;
