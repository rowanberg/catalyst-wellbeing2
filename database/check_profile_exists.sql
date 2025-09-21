-- Check if the profile was created successfully
SELECT 
    p.id,
    p.user_id,
    p.first_name,
    p.last_name,
    p.role,
    p.school_id,
    s.name as school_name,
    s.school_code,
    p.created_at
FROM profiles p
LEFT JOIN schools s ON p.school_id = s.id
WHERE p.user_id = '082f24d3-9f21-4330-8864-fe5c52316c0f';

-- Also check by email lookup (in case the API is using email)
SELECT 
    u.id as auth_user_id,
    u.email,
    u.created_at as auth_created_at,
    p.id as profile_id,
    p.user_id as profile_user_id,
    p.role,
    p.school_id
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.email = 'reltacompany5@gmail.com';

-- Check all profiles to see what exists
SELECT COUNT(*) as total_profiles FROM profiles;
SELECT role, COUNT(*) as count FROM profiles GROUP BY role;
