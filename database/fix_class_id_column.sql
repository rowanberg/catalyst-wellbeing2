-- Fix missing class_id column in profiles table
-- Run this script AFTER creating the classes table and teacher_classes table
-- This script should be run after teacher_class_relationships_schema.sql

-- First, check if the column exists and add it if missing
DO $$ 
BEGIN
    -- Check if classes table exists first
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_name = 'classes') THEN
        RAISE EXCEPTION 'Classes table does not exist. Please run teacher_class_relationships_schema.sql first.';
    END IF;

    -- Add class_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'class_id') THEN
        ALTER TABLE profiles 
        ADD COLUMN class_id UUID;
        
        RAISE NOTICE 'Added class_id column to profiles table';
    ELSE
        RAISE NOTICE 'class_id column already exists in profiles table';
    END IF;

    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_profiles_class_id' 
                   AND table_name = 'profiles') THEN
        ALTER TABLE profiles 
        ADD CONSTRAINT fk_profiles_class_id 
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added foreign key constraint for class_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
END $$;

-- Create index for better performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_profiles_class_id ON profiles(class_id);

-- Update existing student profiles to assign them to appropriate classes
-- This is a sample update - adjust based on your school's class structure
DO $$
DECLARE
    school_record RECORD;
    class_record RECORD;
    student_record RECORD;
BEGIN
    -- For each school, assign students to classes based on their grade level
    FOR school_record IN SELECT id, name FROM schools LOOP
        RAISE NOTICE 'Processing school: %', school_record.name;
        
        -- For each class in this school
        FOR class_record IN 
            SELECT id, name, grade_level 
            FROM classes 
            WHERE school_id = school_record.id 
            ORDER BY grade_level, name
        LOOP
            -- Find students in this school with matching grade level who don't have a class assigned
            FOR student_record IN 
                SELECT id, first_name, last_name, grade_level
                FROM profiles 
                WHERE school_id = school_record.id 
                AND role = 'student' 
                AND grade_level = class_record.grade_level
                AND (class_id IS NULL OR class_id = '')
                LIMIT 25  -- Limit to avoid overcrowding classes
            LOOP
                -- Assign student to this class
                UPDATE profiles 
                SET class_id = class_record.id 
                WHERE id = student_record.id;
                
                RAISE NOTICE 'Assigned student % % to class %', 
                    student_record.first_name, 
                    student_record.last_name, 
                    class_record.name;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- Verify the update
SELECT 
    s.name as school_name,
    c.name as class_name,
    c.grade_level,
    COUNT(p.id) as student_count
FROM schools s
LEFT JOIN classes c ON s.id = c.school_id
LEFT JOIN profiles p ON c.id = p.class_id AND p.role = 'student'
GROUP BY s.name, c.name, c.grade_level
ORDER BY s.name, c.grade_level, c.name;
