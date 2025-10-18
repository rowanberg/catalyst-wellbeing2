-- Fix Teacher Profiles Missing school_id
-- This migration updates teacher profiles that are missing school_id
-- by fetching it from their teacher_class_assignments

-- Update teacher profiles that don't have school_id but have active class assignments
UPDATE profiles
SET 
    school_id = tca.school_id,
    updated_at = NOW()
FROM (
    SELECT DISTINCT ON (teacher_id) 
        teacher_id,
        school_id
    FROM teacher_class_assignments
    WHERE is_active = true
    AND school_id IS NOT NULL
    ORDER BY teacher_id, assigned_at DESC
) AS tca
WHERE profiles.role = 'teacher'
AND profiles.school_id IS NULL
AND (profiles.user_id = tca.teacher_id OR profiles.id = tca.teacher_id);

-- Log the results
DO $$
DECLARE
    updated_count INTEGER;
    remaining_count INTEGER;
    teacher_rec RECORD;
BEGIN
    -- Count updated profiles
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    -- Count remaining teachers without school_id
    SELECT COUNT(*) INTO remaining_count
    FROM profiles
    WHERE role = 'teacher'
    AND school_id IS NULL;
    
    RAISE NOTICE '✅ Updated % teacher profiles with school_id', updated_count;
    RAISE NOTICE '⚠️  % teacher profiles still missing school_id', remaining_count;
    
    IF remaining_count > 0 THEN
        RAISE NOTICE 'Teachers without school_id (need manual review):';
        FOR teacher_rec IN 
            SELECT id, user_id, first_name, last_name
            FROM profiles
            WHERE role = 'teacher'
            AND school_id IS NULL
            LIMIT 10
        LOOP
            RAISE NOTICE '  - % % (id: %, user_id: %)', teacher_rec.first_name, teacher_rec.last_name, teacher_rec.id, teacher_rec.user_id;
        END LOOP;
    END IF;
END $$;

-- Create index to prevent future issues
CREATE INDEX IF NOT EXISTS idx_profiles_role_school_id 
ON profiles(role, school_id) 
WHERE role = 'teacher';

COMMENT ON INDEX idx_profiles_role_school_id IS 'Optimizes teacher queries by role and school_id';
