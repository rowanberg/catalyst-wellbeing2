-- Simple verification to check if school S8BQY3IF3JSK actually exists
-- Run this first to confirm the school is in the database

SELECT 
    'School exists check:' as check_type,
    COUNT(*) as school_count,
    CASE 
        WHEN COUNT(*) > 0 THEN 'SCHOOL EXISTS' 
        ELSE 'SCHOOL NOT FOUND' 
    END as status
FROM schools 
WHERE school_code = 'S8BQY3IF3JSK';

-- If school exists, show its details
SELECT 
    'School details:' as check_type,
    id, 
    name, 
    school_code, 
    created_at,
    admin_id
FROM schools 
WHERE school_code = 'S8BQY3IF3JSK';

-- Check if there are any schools with similar codes
SELECT 
    'Similar school codes:' as check_type,
    school_code,
    name
FROM schools 
WHERE school_code ILIKE '%S8BQY3IF3JSK%' 
   OR school_code ILIKE '%s8bqy3if3jsk%'
   OR UPPER(school_code) = 'S8BQY3IF3JSK';

-- Show all school codes to see what's actually in the database
SELECT 
    'All school codes in database:' as check_type,
    school_code,
    name,
    created_at
FROM schools 
ORDER BY created_at DESC 
LIMIT 10;
