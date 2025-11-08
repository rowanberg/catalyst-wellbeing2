-- Check if RLS policies exist and are working

-- 1. Check RLS status on tables
SELECT 
  'RLS Status:' as check,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('seat_assignments', 'seating_charts', 'classes')
ORDER BY tablename;

-- 2. Check existing policies
SELECT 
  'Existing Policies:' as check,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('seat_assignments', 'seating_charts', 'classes')
ORDER BY tablename, policyname;

-- 3. Test if we can query seating_charts directly
SELECT 
  'Can we read seating_charts?' as test,
  COUNT(*) as total_charts,
  COUNT(*) FILTER (WHERE is_active = true) as active_charts
FROM seating_charts;

-- 4. Test if we can query classes directly
SELECT 
  'Can we read classes?' as test,
  COUNT(*) as total_classes
FROM classes;
