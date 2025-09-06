-- Update help_requests table to support 'urgent' urgency level and additional fields for emergency tracking

-- Add 'urgent' to urgency check constraint
ALTER TABLE help_requests DROP CONSTRAINT IF EXISTS help_requests_urgency_check;
ALTER TABLE help_requests ADD CONSTRAINT help_requests_urgency_check 
    CHECK (urgency IN ('low', 'medium', 'high', 'urgent'));

-- Add additional fields for better emergency incident tracking
ALTER TABLE help_requests 
ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS incident_type VARCHAR(50) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS follow_up_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update status constraint to include more statuses
ALTER TABLE help_requests DROP CONSTRAINT IF EXISTS help_requests_status_check;
ALTER TABLE help_requests ADD CONSTRAINT help_requests_status_check 
    CHECK (status IN ('pending', 'acknowledged', 'in_progress', 'resolved', 'escalated'));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_help_requests_urgency ON help_requests(urgency);
CREATE INDEX IF NOT EXISTS idx_help_requests_created_at ON help_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_help_requests_priority_score ON help_requests(priority_score);

-- Update RLS policies to allow admins to update help requests
DROP POLICY IF EXISTS "Admins can update help requests" ON help_requests;
CREATE POLICY "Admins can update help requests" ON help_requests FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Add policy for teachers to update help requests in their school
DROP POLICY IF EXISTS "Teachers can update help requests" ON help_requests;
CREATE POLICY "Teachers can update help requests" ON help_requests FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles p1
        JOIN profiles p2 ON p1.school_id = p2.school_id
        WHERE p1.user_id = auth.uid() 
        AND p1.role = 'teacher'
        AND p2.user_id = help_requests.student_id
    )
);

-- Function to automatically set priority score based on urgency
CREATE OR REPLACE FUNCTION set_help_request_priority()
RETURNS TRIGGER AS $$
BEGIN
    CASE NEW.urgency
        WHEN 'urgent' THEN NEW.priority_score = 4;
        WHEN 'high' THEN NEW.priority_score = 3;
        WHEN 'medium' THEN NEW.priority_score = 2;
        WHEN 'low' THEN NEW.priority_score = 1;
    END CASE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set priority score on insert/update
DROP TRIGGER IF EXISTS set_help_request_priority_trigger ON help_requests;
CREATE TRIGGER set_help_request_priority_trigger
    BEFORE INSERT OR UPDATE ON help_requests
    FOR EACH ROW EXECUTE FUNCTION set_help_request_priority();
