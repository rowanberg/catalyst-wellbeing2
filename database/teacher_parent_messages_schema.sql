-- Teacher-Parent Communication Schema
-- Secure messaging system between teachers and parents

-- Create teacher_parent_messages table
CREATE TABLE IF NOT EXISTS teacher_parent_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  
  -- Message content
  subject VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(20) NOT NULL CHECK (message_type IN (
    'direct', 'announcement', 'urgent', 'reminder'
  )),
  priority VARCHAR(10) NOT NULL CHECK (priority IN (
    'low', 'medium', 'high'
  )) DEFAULT 'medium',
  
  -- Status and metadata
  read_status BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  reply_to_id UUID REFERENCES teacher_parent_messages(id),
  
  -- Encryption and security
  is_encrypted BOOLEAN DEFAULT true,
  encryption_key_id VARCHAR(100),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure sender and receiver are from same school
  CONSTRAINT messages_school_consistency CHECK (
    (SELECT school_id FROM profiles WHERE id = sender_id) = school_id AND
    (SELECT school_id FROM profiles WHERE id = receiver_id) = school_id
  ),
  
  -- Ensure valid sender/receiver roles
  CONSTRAINT messages_role_validation CHECK (
    (
      (SELECT role FROM profiles WHERE id = sender_id) = 'teacher' AND
      (SELECT role FROM profiles WHERE id = receiver_id) = 'parent'
    ) OR (
      (SELECT role FROM profiles WHERE id = sender_id) = 'parent' AND
      (SELECT role FROM profiles WHERE id = receiver_id) = 'teacher'
    )
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_teacher_parent_messages_sender ON teacher_parent_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_teacher_parent_messages_receiver ON teacher_parent_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_teacher_parent_messages_school ON teacher_parent_messages(school_id);
CREATE INDEX IF NOT EXISTS idx_teacher_parent_messages_created_at ON teacher_parent_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_teacher_parent_messages_read_status ON teacher_parent_messages(receiver_id, read_status);
CREATE INDEX IF NOT EXISTS idx_teacher_parent_messages_type ON teacher_parent_messages(message_type, priority);

-- Row Level Security (RLS) policies
ALTER TABLE teacher_parent_messages ENABLE ROW LEVEL SECURITY;

-- Users can see messages they sent or received
CREATE POLICY "Users can view their own messages" ON teacher_parent_messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

-- Users can send messages to users in their school with appropriate roles
CREATE POLICY "Teachers can send messages to parents" ON teacher_parent_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'teacher' 
      AND school_id = teacher_parent_messages.school_id
    ) AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = receiver_id 
      AND role = 'parent' 
      AND school_id = teacher_parent_messages.school_id
    )
  );

-- Parents can send messages to teachers
CREATE POLICY "Parents can send messages to teachers" ON teacher_parent_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'parent' 
      AND school_id = teacher_parent_messages.school_id
    ) AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = receiver_id 
      AND role = 'teacher' 
      AND school_id = teacher_parent_messages.school_id
    )
  );

-- Users can update read status of messages they received
CREATE POLICY "Users can update read status of received messages" ON teacher_parent_messages
  FOR UPDATE USING (
    auth.uid() = receiver_id
  ) WITH CHECK (
    auth.uid() = receiver_id
  );

-- Create message threads table for conversation grouping
CREATE TABLE IF NOT EXISTS message_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  subject VARCHAR(200) NOT NULL,
  participants UUID[] NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure all participants are from same school
  CONSTRAINT threads_school_consistency CHECK (
    (SELECT COUNT(*) FROM profiles WHERE id = ANY(participants) AND school_id = message_threads.school_id) = array_length(participants, 1)
  )
);

-- Add thread_id to messages table
ALTER TABLE teacher_parent_messages 
ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES message_threads(id);

-- Create indexes for threads
CREATE INDEX IF NOT EXISTS idx_message_threads_school ON message_threads(school_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_participants ON message_threads USING GIN(participants);
CREATE INDEX IF NOT EXISTS idx_message_threads_last_message ON message_threads(last_message_at DESC);

-- RLS for message threads
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view threads they participate in" ON message_threads
  FOR SELECT USING (
    auth.uid() = ANY(participants)
  );

-- Create trigger to update thread last_message_at
CREATE OR REPLACE FUNCTION update_thread_last_message()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.thread_id IS NOT NULL THEN
    UPDATE message_threads 
    SET last_message_at = NEW.created_at 
    WHERE id = NEW.thread_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_thread_last_message
  AFTER INSERT ON teacher_parent_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_last_message();

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_messages_updated_at
  BEFORE UPDATE ON teacher_parent_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_messages_updated_at();

-- Create view for message summaries with sender/receiver info
CREATE OR REPLACE VIEW message_summaries AS
SELECT 
  m.id,
  m.sender_id,
  m.receiver_id,
  m.school_id,
  m.subject,
  m.content,
  m.message_type,
  m.priority,
  m.read_status,
  m.created_at,
  m.thread_id,
  s.first_name || ' ' || s.last_name AS sender_name,
  s.role AS sender_role,
  r.first_name || ' ' || r.last_name AS receiver_name,
  r.role AS receiver_role
FROM teacher_parent_messages m
JOIN profiles s ON m.sender_id = s.id
JOIN profiles r ON m.receiver_id = r.id
ORDER BY m.created_at DESC;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON teacher_parent_messages TO authenticated;
GRANT SELECT, INSERT ON message_threads TO authenticated;
GRANT SELECT ON message_summaries TO authenticated;
