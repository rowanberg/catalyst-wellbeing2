-- Add description column to existing kindness_counter table
ALTER TABLE kindness_counter 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Ensure user_id has a unique constraint (should already exist)
-- This helps with the upsert operation
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'kindness_counter_user_id_key'
    ) THEN
        ALTER TABLE kindness_counter 
        ADD CONSTRAINT kindness_counter_user_id_key UNIQUE (user_id);
    END IF;
END $$;
