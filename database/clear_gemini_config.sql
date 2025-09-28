-- Clear Gemini configuration to force reconfiguration with correct model names
-- Run this in Supabase SQL Editor if needed

DELETE FROM student_gemini_config 
WHERE user_id = auth.uid();

-- This will force the user to reconfigure their Gemini settings with the correct model names
