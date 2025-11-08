-- TEMPORARY FIX - Disable RLS completely to test
-- WARNING: This removes all security! Only for testing!

-- Disable RLS on seating tables
ALTER TABLE seating_charts DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT 
  'RLS Status After Disable' as status,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('seating_charts', 'classes');

-- Note: Re-enable RLS after testing with:
-- ALTER TABLE seating_charts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
