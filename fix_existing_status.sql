-- Fix existing school_details records to have correct status
-- This will update records that have setup_completed = true but status = 'not_completed'

-- First, let's see what we have
SELECT id, school_id, school_name, setup_completed, status, setup_completed_at 
FROM school_details 
ORDER BY created_at DESC;

-- Update records that are completed but have wrong status
UPDATE school_details 
SET status = 'completed'
WHERE setup_completed = true 
  AND status != 'completed';

-- Verify the update
SELECT id, school_id, school_name, setup_completed, status, setup_completed_at 
FROM school_details 
WHERE setup_completed = true;

-- Also ensure any records with setup_completed = false have status = 'not_completed'
UPDATE school_details 
SET status = 'not_completed'
WHERE setup_completed = false 
  AND status = 'completed';

-- Final verification
SELECT 
  status,
  setup_completed,
  COUNT(*) as count
FROM school_details 
GROUP BY status, setup_completed
ORDER BY status;
