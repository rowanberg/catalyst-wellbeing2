-- Query to view all RLS policy conditions for verification
SELECT 
    tablename,
    policyname,
    cmd as command,
    qual as using_condition,
    with_check as with_check_condition,
    roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- To see only policies with duplicates (multiple policies for same table/action):
SELECT 
    tablename,
    cmd as command,
    COUNT(*) as policy_count,
    string_agg(policyname, ', ' ORDER BY policyname) as policy_names
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename, cmd, roles
HAVING COUNT(*) > 1
ORDER BY policy_count DESC, tablename;

-- To view conditions for a specific table:
-- SELECT tablename, policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'YOUR_TABLE_NAME'
-- ORDER BY cmd, policyname;
