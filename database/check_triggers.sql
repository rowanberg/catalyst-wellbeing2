-- Check for triggers on profiles table that might reference schools
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'profiles';

-- Check functions that might reference schools
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_type = 'FUNCTION'
AND routine_definition ILIKE '%schools%';

-- Check the search_path setting
SHOW search_path;
