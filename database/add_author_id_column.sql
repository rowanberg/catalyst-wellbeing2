-- Add missing author_id column to school_announcements table
-- This fixes the PGRST204 error: Could not find the 'author_id' column

ALTER TABLE school_announcements 
ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
