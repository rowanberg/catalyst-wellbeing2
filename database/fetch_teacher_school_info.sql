-- Fetch school information for a specific teacher
-- Replace 'rowanberg567@gmail.com' with the actual teacher's email

-- First, get the teacher's profile and school_id
SELECT 
    p.user_id,
    p.first_name,
    p.last_name,
    p.email,
    p.role,
    p.school_id,
    p.created_at as profile_created
FROM profiles p
WHERE p.email = 'rowanberg567@gmail.com' 
  AND p.role = 'teacher';

-- Get the school information using the school_id from above
-- Replace 'f2baa26b-ad79-4576-bead-e57dc942e4f8' with the actual school_id from the query above
SELECT 
    s.*,
    'Basic school record' as source
FROM schools s
WHERE s.id = 'f2baa26b-ad79-4576-bead-e57dc942e4f8';

-- Get detailed school information if available
SELECT 
    sd.*,
    'Detailed school setup' as source
FROM school_details sd
WHERE sd.school_id = 'f2baa26b-ad79-4576-bead-e57dc942e4f8';

-- Get school statistics
SELECT 
    'Students' as type,
    COUNT(*) as count
FROM profiles 
WHERE school_id = 'f2baa26b-ad79-4576-bead-e57dc942e4f8' 
  AND role = 'student'

UNION ALL

SELECT 
    'Teachers' as type,
    COUNT(*) as count
FROM profiles 
WHERE school_id = 'f2baa26b-ad79-4576-bead-e57dc942e4f8' 
  AND role = 'teacher'

UNION ALL

SELECT 
    'Admins' as type,
    COUNT(*) as count
FROM profiles 
WHERE school_id = 'f2baa26b-ad79-4576-bead-e57dc942e4f8' 
  AND role = 'admin';

-- Check if grade_levels table exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'grade_levels'
        ) 
        THEN 'grade_levels table EXISTS'
        ELSE 'grade_levels table MISSING'
    END as grade_levels_table_status;

-- Get available grade levels (check what columns exist first)
-- First, let's see the structure of grade_levels table if it exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'grade_levels' 
ORDER BY ordinal_position;

-- Get available grade levels (using all columns to see what's available)
SELECT 
    gl.*
FROM grade_levels gl
WHERE gl.school_id = 'f2baa26b-ad79-4576-bead-e57dc942e4f8'
ORDER BY gl.id;

-- Check classes table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'classes' 
ORDER BY ordinal_position;

-- Alternative: Check for grade information in classes table
SELECT 
    DISTINCT c.grade_level_id,
    COUNT(*) as class_count
FROM classes c
WHERE c.school_id = 'f2baa26b-ad79-4576-bead-e57dc942e4f8'
GROUP BY c.grade_level_id
ORDER BY c.grade_level_id;

-- Alternative: Check for grade information in profiles table
SELECT 
    DISTINCT p.grade_level,
    COUNT(*) as student_count
FROM profiles p
WHERE p.school_id = 'f2baa26b-ad79-4576-bead-e57dc942e4f8'
  AND p.role = 'student'
  AND p.grade_level IS NOT NULL
GROUP BY p.grade_level
ORDER BY p.grade_level;

-- Check if school record exists at all
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM schools WHERE id = 'f2baa26b-ad79-4576-bead-e57dc942e4f8') 
        THEN 'School record EXISTS'
        ELSE 'School record MISSING - This is the problem!'
    END as school_status;
