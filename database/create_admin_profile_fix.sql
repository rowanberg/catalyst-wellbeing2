-- Create missing profile record for authenticated admin user
-- User already has admin role configured, just need to create the profile record

DO $$
DECLARE
    school_uuid UUID;
    admin_user_id UUID := '082f24d3-9f21-4330-8864-fe5c52316c0f';
    admin_email TEXT := 'reltacompany5@gmail.com';
BEGIN
    -- Find existing school
    SELECT id INTO school_uuid FROM schools LIMIT 1;
    
    -- Check if profile already exists
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = admin_user_id) THEN
        -- Create the profile record (user already has admin role configured)
        INSERT INTO profiles (
            user_id,
            first_name,
            last_name,
            role,
            school_id,
            xp,
            gems,
            level,
            created_at,
            updated_at
        ) VALUES (
            admin_user_id,
            'Admin',
            'User',
            'admin',
            school_uuid,
            0,
            0,
            1,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Created profile record for existing admin user: %', admin_email;
    ELSE
        RAISE NOTICE 'Profile already exists for user: %', admin_user_id;
    END IF;
END $$;

-- Display the created profile information
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
