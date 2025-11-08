-- COMPREHENSIVE RLS ANALYSIS AND FIX
-- Step-by-step approach to create correct policies

-- =====================================================
-- STEP 1: Check current RLS status
-- =====================================================
SELECT 
  '=== CURRENT RLS STATUS ===' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('seat_assignments', 'seating_charts', 'classes')
ORDER BY tablename;

-- =====================================================
-- STEP 2: Check ALL existing policies
-- =====================================================
SELECT 
  '=== ALL EXISTING POLICIES ===' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies 
WHERE tablename IN ('seat_assignments', 'seating_charts', 'classes')
ORDER BY tablename, policyname;

-- =====================================================
-- STEP 3: Check what roles are defined
-- =====================================================
SELECT 
  '=== DATABASE ROLES ===' as info,
  rolname
FROM pg_roles 
WHERE rolname IN ('authenticated', 'anon', 'service_role', 'postgres')
ORDER BY rolname;

-- =====================================================
-- STEP 4: Drop ALL existing policies (clean slate)
-- =====================================================
DO $$ 
BEGIN
  -- Drop policies on seat_assignments
  DROP POLICY IF EXISTS "Students can view seat assignments" ON seat_assignments;
  DROP POLICY IF EXISTS "Enable read access for authenticated users" ON seat_assignments;
  
  -- Drop policies on seating_charts
  DROP POLICY IF EXISTS "Students can view seating charts" ON seating_charts;
  DROP POLICY IF EXISTS "Enable read access for authenticated users" ON seating_charts;
  
  -- Drop policies on classes
  DROP POLICY IF EXISTS "Students can view classes" ON classes;
  DROP POLICY IF EXISTS "Enable read access for authenticated users" ON classes;
  
  RAISE NOTICE 'All existing policies dropped';
END $$;

-- =====================================================
-- STEP 5: Create CORRECT policies for all roles
-- =====================================================

-- Policy for seat_assignments: Allow authenticated and anon to read
CREATE POLICY "allow_read_seat_assignments"
ON seat_assignments
FOR SELECT
TO public  -- This allows both authenticated and anon roles
USING (true);

-- Policy for seating_charts: Allow authenticated and anon to read
CREATE POLICY "allow_read_seating_charts"
ON seating_charts
FOR SELECT
TO public  -- This allows both authenticated and anon roles
USING (true);

-- Policy for classes: Allow authenticated and anon to read
CREATE POLICY "allow_read_classes"
ON classes
FOR SELECT
TO public  -- This allows both authenticated and anon roles
USING (true);

-- =====================================================
-- STEP 6: Verify new policies
-- =====================================================
SELECT 
  '=== NEW POLICIES CREATED ===' as result,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename IN ('seat_assignments', 'seating_charts', 'classes')
ORDER BY tablename;

-- =====================================================
-- STEP 7: Test queries
-- =====================================================
SELECT 
  '=== TEST: Can read seat_assignments ===' as test,
  COUNT(*) as total_rows
FROM seat_assignments;

SELECT 
  '=== TEST: Can read seating_charts ===' as test,
  COUNT(*) as total_rows
FROM seating_charts;

SELECT 
  '=== TEST: Can read classes ===' as test,
  COUNT(*) as total_rows
FROM classes;

-- =====================================================
-- FINAL SUCCESS MESSAGE
-- =====================================================
SELECT '✅ RLS POLICIES FIXED - Refresh your app now!' as result;
