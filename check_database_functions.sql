-- Check Database Functions for Teacher Assignments
-- This script examines the actual database functions to understand how they work

-- 1. Check the definition of get_teacher_assigned_classes function
SELECT 'GET_TEACHER_ASSIGNED_CLASSES FUNCTION:' as info;
SELECT routine_name, routine_definition
FROM information_schema.routines 
WHERE routine_name = 'get_teacher_assigned_classes'
AND routine_schema = 'public';

-- 2. Check get_teacher_classes function
SELECT 'GET_TEACHER_CLASSES FUNCTION:' as info;
SELECT routine_name, routine_definition
FROM information_schema.routines 
WHERE routine_name = 'get_teacher_classes'
AND routine_schema = 'public';

-- 3. Check get_teacher_grades function
SELECT 'GET_TEACHER_GRADES FUNCTION:' as info;
SELECT routine_name, routine_definition
FROM information_schema.routines 
WHERE routine_name = 'get_teacher_grades'
AND routine_schema = 'public';

-- 4. Test the get_teacher_assigned_classes function directly
SELECT 'TESTING GET_TEACHER_ASSIGNED_CLASSES:' as info;
SELECT * FROM get_teacher_assigned_classes('641bb749-58ed-444e-b39c-984e59a93dd7');

-- 5. Test the get_teacher_classes function if it exists
SELECT 'TESTING GET_TEACHER_CLASSES:' as info;
SELECT * FROM get_teacher_classes('641bb749-58ed-444e-b39c-984e59a93dd7');

-- 6. Check if there are parameters for school_id in these functions
SELECT 'FUNCTION PARAMETERS:' as info;
SELECT 
    routine_name,
    parameter_name,
    data_type,
    parameter_mode
FROM information_schema.parameters 
WHERE specific_schema = 'public'
AND routine_name IN ('get_teacher_assigned_classes', 'get_teacher_classes', 'get_teacher_grades')
ORDER BY routine_name, ordinal_position;

-- 7. Check if we need to call with school_id parameter
SELECT 'TESTING WITH SCHOOL_ID:' as info;
-- Try different parameter combinations
SELECT 'Trying get_teacher_assigned_classes with school_id:' as test;
-- SELECT * FROM get_teacher_assigned_classes('641bb749-58ed-444e-b39c-984e59a93dd7', '142dac48-a69a-46cb-b5a1-22fca8113253');

-- 8. Show all teacher-related functions with their parameters
SELECT 'ALL TEACHER FUNCTIONS WITH PARAMETERS:' as info;
SELECT DISTINCT
    r.routine_name,
    r.routine_type,
    COALESCE(p.parameter_name, 'no_params') as parameter_name,
    COALESCE(p.data_type, 'none') as data_type
FROM information_schema.routines r
LEFT JOIN information_schema.parameters p ON r.specific_name = p.specific_name
WHERE r.routine_schema = 'public'
AND r.routine_name ILIKE '%teacher%'
ORDER BY r.routine_name, p.ordinal_position;
