-- Check current RLS policies on schools table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'schools';

-- Check if RLS is enabled on schools table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'schools';

-- Alternative way to check RLS status
SELECT 
    c.relname as table_name,
    c.relrowsecurity as rls_enabled,
    c.relforcerowsecurity as rls_forced
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'schools' AND n.nspname = 'public';

-- Temporarily disable RLS on schools table to test
-- ALTER TABLE schools DISABLE ROW LEVEL SECURITY;

-- Or create a policy that allows teachers to read their school
DROP POLICY IF EXISTS "Teachers can read their school" ON schools;
CREATE POLICY "Teachers can read their school" ON schools
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.school_id = schools.id 
            AND profiles.user_id = auth.uid()
            AND profiles.role = 'teacher'
        )
    );

-- Also allow admins to read their school
DROP POLICY IF EXISTS "Admins can read their school" ON schools;
CREATE POLICY "Admins can read their school" ON schools
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.school_id = schools.id 
            AND profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Test the policy by checking if the teacher can now access the school
SELECT 
    s.*,
    'School accessible after RLS fix' as status
FROM schools s 
WHERE s.id = 'f2baa26b-ad79-4576-bead-e57dc942e4f8';
