-- Verify RLS policies exist and are correct

-- Check if policies exist
SELECT 
  'Current RLS Policies:' as info,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('seat_assignments', 'seating_charts', 'classes')
ORDER BY tablename, policyname;

-- Check if RLS is enabled
SELECT 
  'RLS Enabled Status:' as info,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('seat_assignments', 'seating_charts', 'classes')
ORDER BY tablename;

-- Test query as anon (this simulates what the API does)
SET ROLE anon;
SELECT 
  'Test as anon role:' as test,
  COUNT(*) as seat_assignments_visible
FROM seat_assignments;

-- Reset role
RESET ROLE;
