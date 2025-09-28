-- Fix incorrect Gemini model names in the database
-- Run this in Supabase SQL Editor

UPDATE student_gemini_config 
SET selected_model = CASE 
  WHEN selected_model = 'gemini-1.5-flash-latest' THEN 'gemini-1.5-flash'
  WHEN selected_model = 'gemini-1.5-pro-latest' THEN 'gemini-1.5-pro'
  WHEN selected_model = 'gemini-1.0-pro' THEN 'gemini-pro'
  ELSE selected_model
END
WHERE selected_model IN ('gemini-1.5-flash-latest', 'gemini-1.5-pro-latest', 'gemini-1.0-pro');

-- Verify the update
SELECT user_id, selected_model, created_at 
FROM student_gemini_config;
