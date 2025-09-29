-- Create a school_details record for JEBIN PUBLIC SCHOOL if it doesn't exist
INSERT INTO school_details (
    school_id,
    school_name,
    principal_name,
    address,
    city,
    state,
    postal_code,
    phone,
    email,
    website,
    school_type,
    established_year,
    mission_statement,
    vision_statement,
    school_hours,
    office_hours,
    emergency_contact,
    nurse_extension,
    security_extension,
    total_students,
    total_teachers,
    grade_levels,
    core_values,
    achievements,
    facilities,
    setup_completed,
    setup_completed_at,
    created_at,
    updated_at
) VALUES (
    'f2baa26b-ad79-4576-bead-e57dc942e4f8',
    'JEBIN PUBLIC SCHOOL',
    'Principal Name', -- Update with actual principal name
    '52/159 KON PALAYAM',
    'Kozhikode', -- Update with actual city
    'Kerala', -- Update with actual state
    '673001', -- Update with actual postal code
    '7010319269',
    'reltacompany5@gmail.com',
    'https://jebinpublicschool.edu', -- Update with actual website
    'Public School',
    2020, -- Update with actual establishment year
    'To provide quality education and nurture young minds for a better tomorrow.',
    'To be a leading educational institution that empowers students to achieve their full potential.',
    '8:00 AM - 3:30 PM',
    '7:30 AM - 4:30 PM',
    'Emergency Contact: 7010319269',
    '123',
    '456',
    500, -- Update with actual student count
    25, -- Update with actual teacher count
    ARRAY['Pre-K', 'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
    ARRAY['Excellence', 'Integrity', 'Innovation', 'Collaboration', 'Respect', 'Compassion'],
    ARRAY[
        'Serving the community since 2020',
        'Excellence in academic performance',
        'Strong community partnerships',
        'Dedicated and qualified teaching staff',
        'Modern facilities and technology integration'
    ],
    ARRAY[
        'Modern Classrooms',
        'Science Laboratory',
        'Computer Lab',
        'Library',
        'Sports Ground',
        'Cafeteria',
        'Administrative Offices',
        'Playground',
        'Auditorium'
    ],
    true,
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (school_id) DO UPDATE SET
    school_name = EXCLUDED.school_name,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    updated_at = NOW();

-- Verify the school_details record was created/updated
SELECT 
    sd.*,
    'School details after insert/update' as status
FROM school_details sd 
WHERE sd.school_id = 'f2baa26b-ad79-4576-bead-e57dc942e4f8';
