-- Drop the trigger that's causing the error
-- This trigger tries to update student_recognition_stats which doesn't exist

DROP TRIGGER IF EXISTS trigger_update_recognition_stats ON public.student_shout_outs;

-- Optional: Drop the function too if it exists
DROP FUNCTION IF EXISTS update_recognition_stats_after_shout_out();

-- Note: When you create the student_recognition_stats table in the future,
-- you can recreate this trigger and function
