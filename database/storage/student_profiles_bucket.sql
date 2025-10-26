-- Create student-profiles storage bucket
-- Run this in Supabase SQL Editor

-- Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-profiles', 'student-profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Note: Storage policies must be created via Supabase Dashboard
-- Go to Storage > student-profiles > Policies and create:
-- 
-- 1. INSERT Policy: "Students can upload profile pictures"
--    - Allowed operation: INSERT
--    - Target roles: authenticated
-- 
-- 2. SELECT Policy: "Anyone can view student profiles" 
--    - Allowed operation: SELECT  
--    - Target roles: public
--
-- 3. UPDATE Policy: "Students can update profile pictures"
--    - Allowed operation: UPDATE
--    - Target roles: authenticated
--
-- 4. DELETE Policy: "Students can delete profile pictures"
--    - Allowed operation: DELETE
--    - Target roles: authenticated
