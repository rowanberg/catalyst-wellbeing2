# Profile Picture Setup Guide

## Database Setup

1. **Add profile picture column to profiles table:**
   ```sql
   -- Run this in Supabase SQL Editor
   ALTER TABLE profiles 
   ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
   
   COMMENT ON COLUMN profiles.profile_picture_url IS 'URL to user profile picture stored in Supabase Storage';
   ```

## Supabase Storage Setup

2. **Create Storage Bucket:**
   - Go to Supabase Dashboard → Storage
   - Click "New Bucket"
   - Bucket name: `profile-pictures`
   - Set as Public: ✅ (checked)
   - Click "Create bucket"

3. **Set Storage Policies:**
   Go to Storage → profile-pictures → Policies and add these policies:

   **Policy 1: Allow users to upload their own profile pictures**
   ```sql
   CREATE POLICY "Users can upload their own profile pictures" ON storage.objects
   FOR INSERT WITH CHECK (
     bucket_id = 'profile-pictures' 
     AND auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

   **Policy 2: Allow public read access to profile pictures**
   ```sql
   CREATE POLICY "Public read access to profile pictures" ON storage.objects
   FOR SELECT USING (bucket_id = 'profile-pictures');
   ```

   **Policy 3: Allow users to update their own profile pictures**
   ```sql
   CREATE POLICY "Users can update their own profile pictures" ON storage.objects
   FOR UPDATE USING (
     bucket_id = 'profile-pictures' 
     AND auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

   **Policy 4: Allow users to delete their own profile pictures**
   ```sql
   CREATE POLICY "Users can delete their own profile pictures" ON storage.objects
   FOR DELETE USING (
     bucket_id = 'profile-pictures' 
     AND auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

## Features Added

✅ **Profile Picture Upload Component**
- File selection with image validation
- Preview modal before uploading
- Progress indicator during upload
- Success/error notifications

✅ **API Endpoint**
- `/api/student/profile-picture` (POST, DELETE)
- File validation (type, size)
- Secure upload to Supabase Storage
- Database profile update

✅ **Student Dashboard Integration**
- Camera icon overlay on profile avatar
- Displays uploaded image or initials fallback
- Real-time profile picture updates

## Usage

1. Students can click the camera icon on their profile avatar
2. Select an image file from their device (JPG, PNG, GIF, etc.)
3. Preview the image and confirm upload
4. Profile picture is saved and displayed immediately

## File Constraints

- **Supported formats:** JPG, PNG, GIF, WebP, etc.
- **Maximum file size:** 5MB
- **Storage location:** Supabase Storage bucket `profile-pictures`
- **Naming convention:** `profile-{user_id}-{timestamp}.{extension}`
