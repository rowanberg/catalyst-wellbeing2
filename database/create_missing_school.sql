-- Create the missing school record
INSERT INTO schools (
    id,
    name,
    address,
    phone,
    email,
    admin_id,
    school_code,
    created_at,
    updated_at
) VALUES (
    'f2baa26b-ad79-4576-bead-e57dc942e4f8',
    'Sample School',
    '123 School Street',
    '(555) 123-4567',
    'info@sampleschool.edu',
    '641bb749-58ed-444e-b39c-984e59a93dd7', -- Using the teacher's user_id as admin for now
    'SCH001',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Verify the school was created
SELECT 
    s.*,
    'Newly created school' as status
FROM schools s 
WHERE s.id = 'f2baa26b-ad79-4576-bead-e57dc942e4f8';
