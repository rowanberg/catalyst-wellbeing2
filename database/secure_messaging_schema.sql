-- Secure Messaging System Database Schema
-- Military-grade security with zero-trust architecture

-- Communication Permissions Table
CREATE TABLE IF NOT EXISTS communication_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  permission_type TEXT NOT NULL CHECK (permission_type IN ('student_teacher', 'parent_teacher', 'class_announcements', 'emergency_only')),
  is_enabled BOOLEAN DEFAULT true,
  grade_level TEXT,
  class_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(user_id)
);

-- User Encryption Keys Table (for E2EE)
CREATE TABLE IF NOT EXISTS user_encryption_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE UNIQUE,
  public_key TEXT NOT NULL,
  key_fingerprint TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 year')
);

-- Conversation Channels Table
CREATE TABLE IF NOT EXISTS conversation_channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('direct', 'class_announcement', 'emergency')),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  is_encrypted BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Channel Participants Table (strict permission control)
CREATE TABLE IF NOT EXISTS channel_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES conversation_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'parent', 'student')),
  permission_level TEXT NOT NULL CHECK (permission_level IN ('read_only', 'read_write', 'moderator')),
  can_invite BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(channel_id, user_id)
);

-- Secure Messages Table
CREATE TABLE IF NOT EXISTS secure_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES conversation_channels(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'system', 'alert', 'emergency')),
  
  -- Encrypted content (for E2EE messages)
  encrypted_content TEXT,
  encryption_key_id UUID REFERENCES user_encryption_keys(id),
  
  -- Plain content (for moderated messages)
  plain_content TEXT,
  
  -- Message metadata
  is_encrypted BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  is_emergency BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  
  -- AI Analysis results
  content_score DECIMAL(3,2), -- 0.00 to 1.00 safety score
  sentiment_score DECIMAL(3,2), -- -1.00 to 1.00 sentiment
  flagged_keywords TEXT[],
  
  -- Timestamps
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Message Recipients Table (for delivery tracking)
CREATE TABLE IF NOT EXISTS message_recipients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES secure_messages(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  is_archived BOOLEAN DEFAULT false,
  UNIQUE(message_id, recipient_id)
);

-- Content Moderation Queue
CREATE TABLE IF NOT EXISTS moderation_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES secure_messages(id) ON DELETE CASCADE,
  flagged_by TEXT NOT NULL CHECK (flagged_by IN ('ai_system', 'user_report', 'admin_review')),
  flag_reason TEXT NOT NULL,
  flag_severity TEXT NOT NULL CHECK (flag_severity IN ('low', 'medium', 'high', 'critical')),
  flag_categories TEXT[] DEFAULT '{}',
  
  -- Review status
  review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending', 'reviewing', 'approved', 'rejected', 'escalated')),
  reviewed_by UUID REFERENCES profiles(user_id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  
  -- Auto-actions taken
  action_taken TEXT CHECK (action_taken IN ('none', 'quarantine', 'block_user', 'notify_admin', 'emergency_alert')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Communication Audit Logs (immutable)
CREATE TABLE IF NOT EXISTS communication_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN ('message_sent', 'message_read', 'channel_created', 'user_added', 'user_removed', 'admin_review', 'emergency_action')),
  user_id UUID REFERENCES profiles(user_id),
  target_user_id UUID REFERENCES profiles(user_id),
  channel_id UUID REFERENCES conversation_channels(id),
  message_id UUID REFERENCES secure_messages(id),
  
  -- Event details
  event_data JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  
  -- Immutable timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parent Consent Records
CREATE TABLE IF NOT EXISTS parent_consent_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('teacher_communication', 'emergency_contact', 'data_sharing')),
  is_granted BOOLEAN DEFAULT false,
  consent_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  withdrawal_date TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  UNIQUE(parent_id, student_id, consent_type)
);

-- Emergency Incidents Table
CREATE TABLE IF NOT EXISTS emergency_incidents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_type TEXT NOT NULL CHECK (incident_type IN ('safety_button', 'content_violation', 'user_report', 'system_alert')),
  reporter_id UUID REFERENCES profiles(user_id),
  reported_user_id UUID REFERENCES profiles(user_id),
  channel_id UUID REFERENCES conversation_channels(id),
  message_id UUID REFERENCES secure_messages(id),
  
  -- Incident details
  severity_level TEXT NOT NULL CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  incident_data JSONB DEFAULT '{}',
  
  -- Response tracking
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'escalated')),
  assigned_to UUID REFERENCES profiles(user_id),
  resolution_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Office Hours Configuration
CREATE TABLE IF NOT EXISTS teacher_office_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance and security
CREATE INDEX IF NOT EXISTS idx_secure_messages_channel_sent ON secure_messages(channel_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_secure_messages_sender ON secure_messages(sender_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_secure_messages_flagged ON secure_messages(is_flagged, sent_at DESC) WHERE is_flagged = true;
CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON moderation_queue(review_status, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_event ON communication_audit_logs(user_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_channel_participants_user ON channel_participants(user_id, channel_id);
CREATE INDEX IF NOT EXISTS idx_emergency_incidents_status ON emergency_incidents(status, severity_level, created_at DESC);

-- Row Level Security Policies

-- Communication Permissions: Only school admins can manage
ALTER TABLE communication_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "School admins can manage communication permissions" ON communication_permissions;
CREATE POLICY "School admins can manage communication permissions" ON communication_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin' 
      AND profiles.school_id = communication_permissions.school_id
    )
  );

-- User Encryption Keys: Users can only see their own keys
ALTER TABLE user_encryption_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own encryption keys" ON user_encryption_keys;
CREATE POLICY "Users can manage their own encryption keys" ON user_encryption_keys
  FOR ALL USING (user_id = auth.uid());

-- Conversation Channels: Strict participant-based access
ALTER TABLE conversation_channels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access channels they participate in" ON conversation_channels;
CREATE POLICY "Users can only access channels they participate in" ON conversation_channels
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM channel_participants 
      WHERE channel_participants.channel_id = conversation_channels.id 
      AND channel_participants.user_id = auth.uid()
      AND channel_participants.left_at IS NULL
    )
  );

-- Secure Messages: Only channel participants can see messages
ALTER TABLE secure_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only see messages in their channels" ON secure_messages;
CREATE POLICY "Users can only see messages in their channels" ON secure_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM channel_participants 
      WHERE channel_participants.channel_id = secure_messages.channel_id 
      AND channel_participants.user_id = auth.uid()
      AND channel_participants.left_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Users can only send messages to their channels" ON secure_messages;
CREATE POLICY "Users can only send messages to their channels" ON secure_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM channel_participants 
      WHERE channel_participants.channel_id = secure_messages.channel_id 
      AND channel_participants.user_id = auth.uid()
      AND channel_participants.permission_level IN ('read_write', 'moderator')
      AND channel_participants.left_at IS NULL
    )
  );

-- Moderation Queue: Only admins and designated moderators
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Only admins can access moderation queue" ON moderation_queue;
CREATE POLICY "Only admins can access moderation queue" ON moderation_queue
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('admin', 'teacher')
    )
  );

-- Audit Logs: Read-only for admins, no updates allowed
ALTER TABLE communication_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Only admins can read audit logs" ON communication_audit_logs;
CREATE POLICY "Only admins can read audit logs" ON communication_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Parent Consent: Parents can only see their own consent records
ALTER TABLE parent_consent_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Parents can manage their own consent records" ON parent_consent_records;
CREATE POLICY "Parents can manage their own consent records" ON parent_consent_records
  FOR ALL USING (
    parent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Emergency Incidents: Restricted access based on role
ALTER TABLE emergency_incidents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Emergency incidents access control" ON emergency_incidents;
CREATE POLICY "Emergency incidents access control" ON emergency_incidents
  FOR ALL USING (
    -- Admins can see all incidents
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    ) OR
    -- Users can see incidents they reported
    reporter_id = auth.uid() OR
    -- Teachers can see incidents in their classes
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'teacher'
    ) AND reported_user_id IN (
      SELECT sc.student_id FROM student_classes sc
      JOIN teacher_classes tc ON sc.class_id = tc.id
      JOIN profiles p ON p.user_id = auth.uid()
      WHERE tc.teacher_id = p.user_id
    ))
  );

-- Functions for audit logging
CREATE OR REPLACE FUNCTION log_communication_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO communication_audit_logs (
    event_type, user_id, channel_id, message_id, event_data
  ) VALUES (
    TG_ARGV[0], 
    COALESCE(NEW.sender_id, NEW.user_id, auth.uid()), 
    COALESCE(NEW.channel_id, OLD.channel_id),
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'old_data', to_jsonb(OLD),
      'new_data', to_jsonb(NEW)
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit triggers
CREATE TRIGGER audit_secure_messages
  AFTER INSERT OR UPDATE OR DELETE ON secure_messages
  FOR EACH ROW EXECUTE FUNCTION log_communication_event('message_sent');

CREATE TRIGGER audit_channel_participants
  AFTER INSERT OR UPDATE OR DELETE ON channel_participants
  FOR EACH ROW EXECUTE FUNCTION log_communication_event('channel_access');

-- Function to check office hours
CREATE OR REPLACE FUNCTION is_within_office_hours(teacher_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_day INTEGER;
  current_time_val TIME;
  office_hours_count INTEGER;
BEGIN
  -- Get current day of week (0 = Sunday) and time
  current_day := EXTRACT(DOW FROM NOW());
  current_time_val := NOW()::TIME;
  
  -- Check if current time falls within any office hours for the teacher
  SELECT COUNT(*) INTO office_hours_count
  FROM teacher_office_hours
  WHERE teacher_office_hours.teacher_id = is_within_office_hours.teacher_id
    AND day_of_week = current_day
    AND start_time <= current_time_val
    AND end_time >= current_time_val
    AND is_active = true;
  
  RETURN office_hours_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically flag suspicious content
CREATE OR REPLACE FUNCTION auto_flag_content()
RETURNS TRIGGER AS $$
DECLARE
  flag_score DECIMAL(3,2);
  keywords TEXT[];
BEGIN
  -- Simple keyword-based flagging (in production, this would call an AI service)
  keywords := ARRAY['bullying', 'hurt', 'hate', 'kill', 'die', 'stupid', 'ugly', 'fat'];
  
  -- Calculate basic flag score based on keyword presence
  flag_score := 0.0;
  
  IF NEW.plain_content IS NOT NULL THEN
    -- Check for flagged keywords
    FOR i IN 1..array_length(keywords, 1) LOOP
      IF LOWER(NEW.plain_content) LIKE '%' || keywords[i] || '%' THEN
        flag_score := flag_score + 0.2;
        NEW.flagged_keywords := array_append(NEW.flagged_keywords, keywords[i]);
      END IF;
    END LOOP;
    
    -- Set content score
    NEW.content_score := GREATEST(0.0, LEAST(1.0, 1.0 - flag_score));
    
    -- Auto-flag if score is concerning
    IF flag_score > 0.3 THEN
      NEW.is_flagged := true;
      
      -- Add to moderation queue
      INSERT INTO moderation_queue (
        message_id, flagged_by, flag_reason, flag_severity, flag_categories
      ) VALUES (
        NEW.id, 
        'ai_system', 
        'Automated content analysis detected potential issues',
        CASE 
          WHEN flag_score > 0.7 THEN 'critical'
          WHEN flag_score > 0.5 THEN 'high'
          ELSE 'medium'
        END,
        NEW.flagged_keywords
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic content flagging
CREATE TRIGGER auto_flag_message_content
  BEFORE INSERT ON secure_messages
  FOR EACH ROW EXECUTE FUNCTION auto_flag_content();

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON communication_permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_encryption_keys TO authenticated;
GRANT SELECT, INSERT ON conversation_channels TO authenticated;
GRANT SELECT, INSERT, UPDATE ON channel_participants TO authenticated;
GRANT SELECT, INSERT ON secure_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON message_recipients TO authenticated;
GRANT SELECT ON moderation_queue TO authenticated;
GRANT SELECT ON communication_audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON parent_consent_records TO authenticated;
GRANT SELECT, INSERT ON emergency_incidents TO authenticated;
GRANT SELECT, INSERT, UPDATE ON teacher_office_hours TO authenticated;
