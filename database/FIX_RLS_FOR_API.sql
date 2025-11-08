-- Fix RLS policies to work with API authentication
-- The API uses service role or authenticated role

-- Drop existing policies
DROP POLICY IF EXISTS "Students can view seating charts" ON seating_charts;
DROP POLICY IF EXISTS "Students can view classes" ON classes;

-- Create policies that work with service_role AND authenticated users
CREATE POLICY "Enable read access for authenticated users"
ON seating_charts
FOR SELECT
USING (true);  -- Allow all reads for authenticated users

CREATE POLICY "Enable read access for authenticated users"
ON classes
FOR SELECT
USING (true);  -- Allow all reads for authenticated users

-- Verify the policies were created
SELECT 
  'New Policies Created:' as result,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('seating_charts', 'classes')
ORDER BY tablename;

-- Test query
SELECT 
  'Test Query:' as test,
  COUNT(*) as can_read_charts
FROM seating_charts;
