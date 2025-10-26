-- ============================================
-- STUDENT PROFILES STORAGE BUCKET SETUP
-- ============================================
-- Run this in Supabase SQL Editor

-- Step 1: Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-profiles', 
  'student-profiles', 
  true,  -- Public bucket for viewing
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[];

-- ============================================
-- IMPORTANT: Storage RLS Policies
-- ============================================
-- Storage policies CANNOT be created via SQL due to table ownership restrictions.
-- You must create them via Supabase Dashboard.
--
-- However, your API already uses createAdminClient() which bypasses RLS,
-- so the upload will work WITHOUT these policies.
--
-- To add policies (optional for future client-side uploads):
-- 1. Go to Supabase Dashboard
-- 2. Navigate to Storage → student-profiles → Policies
-- 3. Create these 4 policies:

-- Policy 1: INSERT - "Students can upload profile pictures"
-- Target roles: authenticated
-- WITH CHECK: true (allows all authenticated users)

-- Policy 2: SELECT - "Anyone can view student profiles"  
-- Target roles: public
-- USING: true (allows everyone to view)

-- Policy 3: UPDATE - "Students can update their profile pictures"
-- Target roles: authenticated  
-- USING: auth.uid()::text = (storage.foldername(name))[1]
-- WITH CHECK: auth.uid()::text = (storage.foldername(name))[1]

-- Policy 4: DELETE - "Students can delete their profile pictures"
-- Target roles: authenticated
-- USING: auth.uid()::text = (storage.foldername(name))[1]

-- ============================================
-- VERIFY BUCKET CREATION
-- ============================================
-- Run this to verify the bucket was created:
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'student-profiles';
