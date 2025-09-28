-- Add school_code column to help_requests table for easier filtering

-- Add school_code column to help_requests table
ALTER TABLE help_requests ADD COLUMN IF NOT EXISTS school_code VARCHAR(12);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_help_requests_school_code ON help_requests(school_code);

-- Update existing help_requests to set school_code from their linked school
UPDATE help_requests 
SET school_code = schools.school_code
FROM schools 
WHERE help_requests.school_id = schools.id 
AND help_requests.school_code IS NULL;

-- Fix the specific help request that has null school_code
UPDATE help_requests 
SET school_code = 'S8BQY3IF3JSK'
WHERE id = '691953ba-44f1-48fb-9dc8-933ae9131d10' 
AND school_id = 'f2baa26b-ad79-4576-bead-e57dc942e4f8';
