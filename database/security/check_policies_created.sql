-- Check if parent policies were successfully created
SELECT 
    tablename,
    policyname
FROM pg_policies 
WHERE schemaname = 'public'
AND policyname LIKE '%parent%'
ORDER BY tablename, policyname;

-- Expected output should show:
-- attendance | Parents can view their children's attendance
-- assessments | Parents can view their children's assessments  
-- community_posts | Parents can view posts for their children's school
-- post_reactions | Parents can manage their own reactions
-- etc...
