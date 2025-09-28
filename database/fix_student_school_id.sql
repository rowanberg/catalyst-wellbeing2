-- Fix student school_id issue
-- The student has school_id 'f2baa26b-ad79-4576-bead-e57dc942e4f8' but school data is null

-- First, check what schools exist
SELECT id, name, school_code FROM schools;

-- Check the specific student profile
SELECT id, first_name, last_name, role, school_id, school_code 
FROM profiles 
WHERE id = '303d5dd0-114c-4978-b89c-229fad7c9804';

-- Check if the school_id exists in schools table
SELECT id, name, school_code 
FROM schools 
WHERE id = 'f2baa26b-ad79-4576-bead-e57dc942e4f8';

-- If the school doesn't exist, create it or update the student's school_id
-- First, let's see if there's a school with the student's school_code
SELECT id, name, school_code 
FROM schools 
WHERE school_code = 'S8BQY3IF3JSK';

-- If no school exists with that code, create one
INSERT INTO schools (id, name, school_code, address, phone, email, created_at, updated_at)
SELECT 
    'f2baa26b-ad79-4576-bead-e57dc942e4f8'::uuid,
    'Demo School',
    'S8BQY3IF3JSK',
    '123 School Street',
    '555-0123',
    'admin@demoschool.edu',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM schools WHERE id = 'f2baa26b-ad79-4576-bead-e57dc942e4f8'
);

-- First, check if school_announcements table exists and its structure
SELECT table_name FROM information_schema.tables WHERE table_name = 'school_announcements';

-- Check the actual structure of school_announcements table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'school_announcements' 
ORDER BY ordinal_position;

-- Check existing announcements to understand the current structure
SELECT id, title, content, priority, target_audience, school_id, is_active, expires_at, created_at FROM school_announcements LIMIT 3;

-- Add missing columns if they don't exist
ALTER TABLE school_announcements ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);
ALTER TABLE school_announcements ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE school_announcements ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE school_announcements ADD COLUMN IF NOT EXISTS author_name VARCHAR(255);
ALTER TABLE school_announcements ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE school_announcements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing announcements to be active
UPDATE school_announcements SET is_active = true WHERE is_active IS NULL;

-- Create a sample announcement for testing
INSERT INTO school_announcements (
    school_id,
    title,
    content,
    priority,
    target_audience,
    author_id,
    author_name,
    created_at,
    updated_at
) VALUES (
    'f2baa26b-ad79-4576-bead-e57dc942e4f8',
    'Welcome to Catalyst!',
    'Welcome to our school well-being platform. Complete your daily quests to earn XP and gems!',
    'medium',
    'students',
    'e34c7332-1b5b-4c3e-8cf4-e6bedafacd9d',
    'Admin User',
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Alternative: If the table stores school_id in the id column (which would be unusual)
-- Then we need to create announcements differently
-- INSERT INTO school_announcements (id, title, content, priority, target_audience, author_id, author_name)
-- VALUES ('f2baa26b-ad79-4576-bead-e57dc942e4f8', 'Welcome!', 'Content here', 'medium', 'students', 'author-id', 'Admin');

-- Verify the fix
SELECT 
    p.id as profile_id,
    p.first_name,
    p.last_name,
    p.school_id,
    p.school_code,
    s.name as school_name,
    s.school_code as school_school_code
FROM profiles p
LEFT JOIN schools s ON p.school_id = s.id
WHERE p.id = '303d5dd0-114c-4978-b89c-229fad7c9804';

-- Verify announcements exist
SELECT id, title, content, priority, target_audience, school_id
FROM school_announcements 
WHERE school_id = 'f2baa26b-ad79-4576-bead-e57dc942e4f8';
