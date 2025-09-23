-- Fix JEBIN's school_details record to match profile school_code
-- This will align the school_code so the API can find the setup data

-- Current situation:
-- JEBIN's profile school_code: S8BQY3IF3JSK
-- School_details record school_code: JEBINPUBLI
-- We need to update school_details to match the profile

-- Update the school_details record for JEBIN's school
UPDATE school_details 
SET school_code = 'S8BQY3IF3JSK'
WHERE school_id = 'f2baa26b-ad79-4576-bead-e57dc942e4f8'
  AND school_code = 'JEBINPUBLI';

-- Verify the update worked
SELECT 
  id,
  school_id,
  school_code,
  school_name,
  status,
  setup_completed,
  setup_completed_at
FROM school_details 
WHERE school_id = 'f2baa26b-ad79-4576-bead-e57dc942e4f8';

-- Also verify JEBIN's profile matches
SELECT 
  first_name,
  last_name,
  school_id,
  school_code
FROM profiles 
WHERE first_name = 'JEBIN' AND last_name = 'ANDREW' AND role = 'admin';

-- Final verification: both should have school_code = 'S8BQY3IF3JSK'
