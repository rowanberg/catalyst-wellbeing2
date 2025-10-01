-- ============================================================================
-- FIX: Add missing class_id column to assessment_analytics table
-- ============================================================================
-- Run this if you get "column class_id does not exist" error
-- ============================================================================

-- Check if the column exists and add it if missing
DO $$ 
BEGIN
    -- Add class_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'assessment_analytics' 
        AND column_name = 'class_id'
    ) THEN
        ALTER TABLE assessment_analytics 
        ADD COLUMN class_id UUID REFERENCES classes(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Added class_id column to assessment_analytics';
        
        -- Create index for the new column
        CREATE INDEX IF NOT EXISTS idx_assessment_analytics_class_id 
        ON assessment_analytics(class_id);
        
        RAISE NOTICE '✅ Created index for class_id';
    ELSE
        RAISE NOTICE 'ℹ️ class_id column already exists';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'assessment_analytics'
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🎉 Fix applied successfully!';
    RAISE NOTICE 'You can now run comprehensive_assessments_part2.sql';
END $$;
