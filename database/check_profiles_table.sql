-- Check if profiles table has class assignment information
-- This might be another place where teacher assignments are stored

-- 1. Check profiles table structure
SELECT 'PROFILES TABLE STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Check if profiles table exists and has teacher data
SELECT 'TEACHER PROFILE DATA:' as info;
SELECT user_id, role, school_id, first_name, last_name, 
       assigned_classes, class_assignments, classes, metadata
FROM profiles 
WHERE user_id = '641bb749-58ed-444e-b39c-984e59a93dd7'
OR role = 'teacher'
LIMIT 5;

-- 3. Check teacher_class_assignments table with school_id
SELECT 'TEACHER_CLASS_ASSIGNMENTS WITH SCHOOL_ID:' as info;
SELECT teacher_id, class_id, school_id, is_primary_teacher, is_active, assigned_at
FROM teacher_class_assignments 
WHERE teacher_id = '641bb749-58ed-444e-b39c-984e59a93dd7';

-- 4. Check if school_id is missing from teacher_class_assignments
SELECT 'TEACHER_CLASS_ASSIGNMENTS STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'teacher_class_assignments'
ORDER BY ordinal_position;

-- 5. Update teacher_class_assignments to include school_id if missing
UPDATE teacher_class_assignments 
SET school_id = '142dac48-a69a-46cb-b5a1-22fca8113253'
WHERE teacher_id = '641bb749-58ed-444e-b39c-984e59a93dd7'
AND (school_id IS NULL OR school_id = '');

-- 6. Check if there's a user_classes or similar table
SELECT 'TABLES WITH USER/CLASS RELATIONSHIPS:' as info;
SELECT table_name
FROM information_schema.tables 
WHERE table_schema = 'public'
AND (
    table_name ILIKE '%user%class%' OR 
    table_name ILIKE '%class%user%' OR
    table_name ILIKE '%teacher%profile%' OR
    table_name ILIKE '%profile%class%'
)
ORDER BY table_name;

-- 7. Final verification after updates
SELECT 'FINAL TEACHER ASSIGNMENTS:' as info;
SELECT 
    tca.teacher_id,
    tca.class_id,
    tca.school_id,
    c.class_name,
    c.class_code,
    gl.grade_level,
    tca.is_primary_teacher,
    tca.is_active
FROM teacher_class_assignments tca
JOIN classes c ON tca.class_id = c.id
LEFT JOIN grade_levels gl ON c.grade_level_id = gl.id
WHERE tca.teacher_id = '641bb749-58ed-444e-b39c-984e59a93dd7'
ORDER BY c.class_name;
