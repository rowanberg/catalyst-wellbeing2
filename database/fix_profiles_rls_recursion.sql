-- Fix infinite recursion in profiles RLS policy
-- The issue: ANY policy that queries profiles table within itself causes infinite recursion

-- First, drop ALL problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles in their school" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles in their school" ON profiles;
DROP POLICY IF EXISTS "View profiles by school" ON profiles;
DROP POLICY IF EXISTS "View profiles in same school" ON profiles;

-- Check what policies remain
SELECT policyname FROM pg_policies WHERE tablename = 'profiles';

-- TEMPORARY FIX: Disable RLS on profiles table for testing
-- WARNING: This allows all authenticated users to see all profiles
-- You should re-enable this with proper policies in production
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';
