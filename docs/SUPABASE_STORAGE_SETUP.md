# Supabase Storage Setup Guide

## Profile Picture Upload Configuration

The profile picture upload feature requires a Supabase Storage bucket to be configured properly.

### 1. Create Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Configure the bucket:
   - **Name:** `profile-pictures`
   - **Public bucket:** ✅ Enable (required for profile pictures to be accessible)
   - **File size limit:** 10 MB (recommended)
   - **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`

### 2. Set Bucket Policies

After creating the bucket, set up the following policies:

#### Policy 1: Allow Authenticated Users to Upload
```sql
-- Policy: "Users can upload their own profile pictures"
CREATE POLICY "Users can upload profile pictures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = 'profile-pictures'
);
```

#### Policy 2: Allow Public Read Access
```sql
-- Policy: "Profile pictures are publicly readable"
CREATE POLICY "Profile pictures are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');
```

#### Policy 3: Allow Users to Update Their Own Pictures
```sql
-- Policy: "Users can update their own profile pictures"
CREATE POLICY "Users can update own profile pictures"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-pictures')
WITH CHECK (bucket_id = 'profile-pictures');
```

#### Policy 4: Allow Users to Delete Their Own Pictures
```sql
-- Policy: "Users can delete their own profile pictures"
CREATE POLICY "Users can delete own profile pictures"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-pictures');
```

### 3. Verify Configuration

Test the setup:

1. Navigate to `/student/settings` in your application
2. Click "Change Profile Picture"
3. Upload an image
4. If you see an error, check the browser console for details

### Common Error Messages

| Error Message | Solution |
|--------------|----------|
| "Storage configuration issue" | Bucket `profile-pictures` doesn't exist. Create it in Supabase Dashboard. |
| "Invalid file format or size" | File must be JPG, PNG, or WebP under 10MB. |
| "Please log in again and try" | Session expired. Log out and log back in. |
| "Failed to update profile" | Check RLS policies on `profiles` table. |

### 4. Verify Bucket Permissions (Optional)

Run this SQL query in the Supabase SQL Editor to check if policies are correctly set:

```sql
-- Check storage policies
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%profile%';
```

### 5. Test Upload Flow

The upload process:
1. ✅ User selects/drops image file
2. ✅ Client validates file (type, size)
3. ✅ Image is optimized using Sharp (400x400px, 85% quality)
4. ✅ File uploaded to `profile-pictures/` bucket
5. ✅ Public URL generated
6. ✅ Profile record updated with new URL
7. ✅ Success dialog shown

### Security Features

- ✅ Rate limiting (5 uploads per 15 minutes)
- ✅ File type validation using magic numbers
- ✅ Automatic image optimization
- ✅ Secure filename generation
- ✅ RLS policies enforce user permissions
- ✅ Automatic cleanup on failed profile updates

### Troubleshooting

**Problem: "bucket not found" error**
```bash
# Check if bucket exists
SELECT * FROM storage.buckets WHERE id = 'profile-pictures';
```

**Problem: Upload succeeds but image doesn't display**
- Ensure bucket is set to **public**
- Check CORS settings in Supabase Storage
- Verify the public URL is being generated correctly

**Problem: Profile not updating after upload**
```sql
-- Check profiles table update permissions
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
  AND cmd = 'UPDATE';
```

### Environment Variables Required

Ensure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key # For admin operations
```

### File Optimization Details

Images are automatically:
- Resized to 400x400px (maintains aspect ratio)
- Converted to JPEG format
- Compressed to 85% quality
- Optimized for web delivery

This ensures fast loading times and consistent display across the platform.

---

## Quick Setup Checklist

- [ ] Create `profile-pictures` bucket in Supabase Storage
- [ ] Enable "Public bucket" setting
- [ ] Add all 4 storage policies (INSERT, SELECT, UPDATE, DELETE)
- [ ] Verify RLS policies on `profiles` table
- [ ] Test upload from student settings page
- [ ] Verify image displays correctly after upload

---

**Last Updated:** 2025-01-16
