-- Mood tracking retention and cleanup system
-- This script creates a system to automatically delete mood entries older than 30 days

-- Create a function to clean up old mood entries
CREATE OR REPLACE FUNCTION cleanup_old_mood_entries()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete mood tracking entries older than 30 days
  DELETE FROM mood_tracking 
  WHERE date < CURRENT_DATE - INTERVAL '30 days';
  
  -- Log the cleanup operation
  RAISE NOTICE 'Cleaned up mood entries older than 30 days at %', NOW();
END;
$$;

-- Create a trigger function that runs daily cleanup
CREATE OR REPLACE FUNCTION trigger_mood_cleanup()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only run cleanup once per day (check if we already cleaned today)
  IF NOT EXISTS (
    SELECT 1 FROM mood_tracking 
    WHERE date = CURRENT_DATE 
    AND user_id = NEW.user_id
    AND created_at < NEW.created_at - INTERVAL '1 minute'
  ) THEN
    PERFORM cleanup_old_mood_entries();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger that runs cleanup when new mood entries are inserted
DROP TRIGGER IF EXISTS mood_cleanup_trigger ON mood_tracking;
CREATE TRIGGER mood_cleanup_trigger
  AFTER INSERT ON mood_tracking
  FOR EACH ROW
  EXECUTE FUNCTION trigger_mood_cleanup();

-- Create an index to optimize the cleanup queries
-- Note: Using a simple index on date column instead of partial index with CURRENT_DATE
-- since CURRENT_DATE is not immutable in index predicates
CREATE INDEX IF NOT EXISTS idx_mood_tracking_date_cleanup 
ON mood_tracking(date);

-- Add a comment explaining the retention policy
COMMENT ON TABLE mood_tracking IS 'Mood tracking data with 30-day retention policy. Entries older than 30 days are automatically deleted.';

-- Optional: Create a scheduled job (requires pg_cron extension)
-- This is commented out as it requires additional setup
/*
-- Enable pg_cron extension (requires superuser privileges)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily cleanup at 2 AM
-- SELECT cron.schedule('mood-cleanup', '0 2 * * *', 'SELECT cleanup_old_mood_entries();');
*/

-- Manual cleanup command (can be run as needed)
-- SELECT cleanup_old_mood_entries();
