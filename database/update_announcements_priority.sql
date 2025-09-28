-- Update school_announcements table to allow 'urgent' priority
-- This migration adds 'urgent' to the priority CHECK constraint

-- Drop the existing constraint
ALTER TABLE school_announcements DROP CONSTRAINT IF EXISTS school_announcements_priority_check;

-- Add the updated constraint with 'urgent' included
ALTER TABLE school_announcements ADD CONSTRAINT school_announcements_priority_check 
    CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
