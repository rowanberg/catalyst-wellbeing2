-- Add resolver columns to help_requests table for tracking resolution details

ALTER TABLE help_requests 
ADD COLUMN IF NOT EXISTS resolver TEXT,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index for better query performance on resolved requests
CREATE INDEX IF NOT EXISTS idx_help_requests_status_resolved_at 
ON help_requests(status, resolved_at DESC) 
WHERE status = 'resolved';

-- Create index for resolver queries
CREATE INDEX IF NOT EXISTS idx_help_requests_resolver 
ON help_requests(resolver) 
WHERE resolver IS NOT NULL;
