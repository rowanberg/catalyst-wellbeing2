-- Add profile picture URL column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.profile_picture_url IS 'URL to user profile picture stored in Supabase Storage';

-- Create storage bucket for profile pictures if it doesn't exist
-- Note: This needs to be run in Supabase Storage settings or via dashboard
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('profile-pictures', 'profile-pictures', true)
-- ON CONFLICT (id) DO NOTHING;

-- Create RLS policy for profile pictures storage bucket
-- Note: This needs to be configured in Supabase Storage settings
-- Allow users to upload their own profile pictures
-- Allow public read access to profile pictures
