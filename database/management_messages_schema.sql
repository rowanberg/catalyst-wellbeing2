-- Management Messages Table
-- Stores messages sent from admin/management to students

-- Create the management_messages table
CREATE TABLE IF NOT EXISTS management_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'management' CHECK (message_type IN ('management', 'announcement', 'alert', 'reminder')),
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('admin', 'teacher', 'principal')),
    is_read BOOLEAN DEFAULT false,
    is_urgent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_subject_length CHECK (char_length(subject) >= 1 AND char_length(subject) <= 200),
    CONSTRAINT valid_content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 5000)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_management_messages_recipient 
ON management_messages(recipient_id);

CREATE INDEX IF NOT EXISTS idx_management_messages_sender 
ON management_messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_management_messages_school 
ON management_messages(school_id);

CREATE INDEX IF NOT EXISTS idx_management_messages_created_at 
ON management_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_management_messages_unread 
ON management_messages(recipient_id, is_read) 
WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_management_messages_urgent 
ON management_messages(recipient_id, is_urgent) 
WHERE is_urgent = true;

-- Row Level Security (RLS) Policies
ALTER TABLE management_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Students can only read messages sent to them
CREATE POLICY "Students can read own messages" 
ON management_messages
FOR SELECT 
USING (
    auth.uid() = recipient_id
    AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'student'
    )
);

-- Policy: Students can update read status of their own messages
CREATE POLICY "Students can update own message status" 
ON management_messages
FOR UPDATE 
USING (
    auth.uid() = recipient_id
    AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'student'
    )
)
WITH CHECK (
    auth.uid() = recipient_id
    AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'student'
    )
);

-- Policy: Admins and teachers can send messages to students in their school
CREATE POLICY "Staff can send messages in their school" 
ON management_messages
FOR INSERT 
WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
        SELECT 1 FROM profiles sender_profile
        WHERE sender_profile.id = auth.uid()
        AND sender_profile.role IN ('admin', 'teacher', 'principal')
        AND sender_profile.school_id = management_messages.school_id
        AND EXISTS (
            SELECT 1 FROM profiles recipient_profile
            WHERE recipient_profile.id = management_messages.recipient_id
            AND recipient_profile.school_id = sender_profile.school_id
        )
    )
);

-- Policy: Staff can read messages they sent
CREATE POLICY "Staff can read sent messages" 
ON management_messages
FOR SELECT 
USING (
    auth.uid() = sender_id
    AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'teacher', 'principal')
    )
);

-- Policy: Staff can read all messages in their school (for monitoring)
CREATE POLICY "Staff can read school messages" 
ON management_messages
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM profiles staff_profile
        WHERE staff_profile.id = auth.uid()
        AND staff_profile.role IN ('admin', 'teacher', 'principal')
        AND staff_profile.school_id = management_messages.school_id
    )
);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_management_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update the updated_at column
CREATE TRIGGER update_management_messages_updated_at_trigger
    BEFORE UPDATE ON management_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_management_messages_updated_at();

-- Function to notify students of new messages (for real-time updates)
CREATE OR REPLACE FUNCTION notify_new_management_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Send notification payload
    PERFORM pg_notify(
        'new_management_message',
        json_build_object(
            'recipient_id', NEW.recipient_id,
            'sender_name', NEW.sender_name,
            'subject', NEW.subject,
            'message_type', NEW.message_type,
            'is_urgent', NEW.is_urgent,
            'created_at', NEW.created_at
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for real-time notifications
CREATE TRIGGER notify_new_management_message_trigger
    AFTER INSERT ON management_messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_management_message();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON management_messages TO authenticated;

-- Comments for documentation
COMMENT ON TABLE management_messages IS 'Messages sent from admin/management to students';
COMMENT ON COLUMN management_messages.sender_id IS 'Admin/teacher who sent the message';
COMMENT ON COLUMN management_messages.recipient_id IS 'Student who receives the message';
COMMENT ON COLUMN management_messages.school_id IS 'School context for the message';
COMMENT ON COLUMN management_messages.subject IS 'Message subject/title';
COMMENT ON COLUMN management_messages.content IS 'Message content/body';
COMMENT ON COLUMN management_messages.message_type IS 'Type of message (management, announcement, alert, reminder)';
COMMENT ON COLUMN management_messages.sender_name IS 'Display name of the sender';
COMMENT ON COLUMN management_messages.sender_role IS 'Role of the sender (admin, teacher, principal)';
COMMENT ON COLUMN management_messages.is_read IS 'Whether the student has read the message';
COMMENT ON COLUMN management_messages.is_urgent IS 'Whether the message is marked as urgent';

-- Sample data for testing (optional)
-- INSERT INTO management_messages (sender_id, recipient_id, school_id, subject, content, sender_name, sender_role, message_type)
-- VALUES 
--     ('admin-user-id', 'student-user-id', 'school-id', 'Welcome Message', 'Welcome to our school platform!', 'Admin Name', 'admin', 'management')
-- ON CONFLICT DO NOTHING;
