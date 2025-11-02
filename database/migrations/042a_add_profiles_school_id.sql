-- ============================================
-- PRE-REQUISITE: Add school_id to profiles table
-- RUN THIS FIRST before 042_subscription_sync_integration.sql
-- ============================================

-- Add school_id column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS school_id UUID;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON profiles(school_id);

-- Add foreign key constraint to schools table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_profiles_school_id' 
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT fk_profiles_school_id 
      FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added foreign key constraint fk_profiles_school_id';
  END IF;
END $$;

-- Verify the column was created
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'school_id';

-- Expected result:
-- column_name | data_type | is_nullable | column_default
-- school_id   | uuid      | YES         | null
