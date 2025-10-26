-- Migration: Add email column to profiles table
-- Date: 2025-10-26
-- Priority: CRITICAL - Fixes parent registration

-- Add email column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Create index for fast email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON profiles(email);

-- Backfill existing profiles with email from auth.users
UPDATE profiles p
SET email = (
  SELECT au.email 
  FROM auth.users au 
  WHERE au.id = p.user_id
)
WHERE p.email IS NULL;

-- Add unique constraint to prevent duplicate emails
ALTER TABLE profiles
ADD CONSTRAINT unique_profile_email UNIQUE (email);

-- Verify migration
SELECT 
  COUNT(*) as total_profiles,
  COUNT(email) as profiles_with_email,
  COUNT(*) - COUNT(email) as profiles_without_email
FROM profiles;
