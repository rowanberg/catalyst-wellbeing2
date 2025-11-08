-- Diagnose RLS issues - Check actual status

-- 1. Check if RLS is enabled
SELECT 
  'RLS Status' as check,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('seating_charts', 'classes')
ORDER BY tablename;

-- 2. Check ALL policies on these tables
SELECT 
  'All Policies' as check,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as has_qual
FROM pg_policies 
WHERE tablename IN ('seating_charts', 'classes')
ORDER BY tablename, policyname;

-- 3. Try to query seating_charts directly (this will show if RLS blocks it)
SELECT 
  'Direct Query Test' as test,
  id,
  class_id,
  layout_name,
  is_active
FROM seating_charts
WHERE id = 'c9a2197f-0a84-431f-a3ab-62dec98d721a';

-- 4. Count total records (RLS might block this too)
SELECT 
  'Total Count' as test,
  COUNT(*) as total_charts
FROM seating_charts;
