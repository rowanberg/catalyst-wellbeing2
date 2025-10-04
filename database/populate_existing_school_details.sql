-- Create school_details entries for existing schools that don't have them
-- Run this in Supabase SQL Editor

INSERT INTO school_details (
    school_id,
    school_name,
    school_code,
    primary_email,
    primary_phone,
    street_address,
    school_type,
    setup_completed,
    setup_completed_by,
    created_at
)
SELECT 
    s.id as school_id,
    s.name as school_name,
    s.school_code,
    s.email as primary_email,
    s.phone as primary_phone,
    s.address as street_address,
    'Public' as school_type,  -- Default type
    false as setup_completed, -- Will trigger setup flow
    s.admin_id as setup_completed_by,
    NOW() as created_at
FROM schools s
WHERE s.id NOT IN (
    SELECT school_id 
    FROM school_details 
    WHERE school_id IS NOT NULL
)
AND s.id IS NOT NULL;

-- Verify the results
SELECT 
    s.name as school_name,
    s.school_code,
    sd.setup_completed,
    sd.created_at as details_created
FROM schools s
JOIN school_details sd ON s.id = sd.school_id
ORDER BY sd.created_at DESC;
