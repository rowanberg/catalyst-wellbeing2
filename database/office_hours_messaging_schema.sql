-- Office Hours Messaging System Database Schema
-- Enables secure, moderated communication between students and teachers during designated office hours

-- Teacher Office Hours Table
CREATE TABLE IF NOT EXISTS teacher_office_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    UNIQUE(teacher_id, day_of_week, start_time, end_time)
);

-- Office Hours Conversations Table
CREATE TABLE IF NOT EXISTS office_hours_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'pending_approval', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    end_reason TEXT
);

-- Office Hours Messages Table
CREATE TABLE IF NOT EXISTS office_hours_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES office_hours_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('student', 'teacher', 'system')),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    is_moderated BOOLEAN DEFAULT false,
    moderation_flags TEXT[],
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT content_length CHECK (length(content) <= 500 AND length(content) > 0)
);

-- Moderation Log Table
CREATE TABLE IF NOT EXISTS office_hours_moderation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES office_hours_conversations(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    original_content TEXT NOT NULL,
    moderation_reason TEXT NOT NULL,
    action_taken TEXT DEFAULT 'blocked',
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications Table for Office Hours
CREATE TABLE IF NOT EXISTS office_hours_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('new_message', 'conversation_started', 'conversation_ended', 'office_hours_starting', 'office_hours_ending')),
    conversation_id UUID REFERENCES office_hours_conversations(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_teacher_office_hours_teacher_day ON teacher_office_hours(teacher_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_teacher_office_hours_school ON teacher_office_hours(school_id);
CREATE INDEX IF NOT EXISTS idx_office_hours_conversations_student ON office_hours_conversations(student_id, status);
CREATE INDEX IF NOT EXISTS idx_office_hours_conversations_teacher ON office_hours_conversations(teacher_id, status);
CREATE INDEX IF NOT EXISTS idx_office_hours_conversations_school ON office_hours_conversations(school_id);
CREATE INDEX IF NOT EXISTS idx_office_hours_messages_conversation ON office_hours_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_office_hours_messages_sender ON office_hours_messages(sender_id, created_at);
CREATE INDEX IF NOT EXISTS idx_office_hours_messages_unread ON office_hours_messages(conversation_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_office_hours_notifications_recipient ON office_hours_notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_moderation_log_student ON office_hours_moderation_log(student_id, created_at);

-- Row Level Security Policies

-- Teacher Office Hours Policies
ALTER TABLE teacher_office_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage their own office hours" ON teacher_office_hours
    FOR ALL USING (
        auth.uid() = teacher_id AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
    );

CREATE POLICY "Students can view teacher office hours from their school" ON teacher_office_hours
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'student' 
            AND school_id = teacher_office_hours.school_id
        )
    );

CREATE POLICY "Admins can manage office hours in their school" ON teacher_office_hours
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin' 
            AND school_id = teacher_office_hours.school_id
        )
    );

-- Office Hours Conversations Policies
ALTER TABLE office_hours_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own conversations" ON office_hours_conversations
    FOR SELECT USING (
        auth.uid() = student_id AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student')
    );

CREATE POLICY "Teachers can view conversations with their students" ON office_hours_conversations
    FOR SELECT USING (
        auth.uid() = teacher_id AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
    );

CREATE POLICY "Students can create conversations with teachers from their school" ON office_hours_conversations
    FOR INSERT WITH CHECK (
        auth.uid() = student_id AND 
        EXISTS (
            SELECT 1 FROM profiles p1, profiles p2 
            WHERE p1.id = auth.uid() 
            AND p1.role = 'student' 
            AND p2.id = teacher_id 
            AND p2.role = 'teacher' 
            AND p1.school_id = p2.school_id
            AND p1.school_id = office_hours_conversations.school_id
        )
    );

CREATE POLICY "Teachers can update conversation status" ON office_hours_conversations
    FOR UPDATE USING (
        auth.uid() = teacher_id AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
    );

CREATE POLICY "Admins can view and manage conversations in their school" ON office_hours_conversations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin' 
            AND school_id = office_hours_conversations.school_id
        )
    );

-- Office Hours Messages Policies
ALTER TABLE office_hours_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conversation participants can view messages" ON office_hours_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM office_hours_conversations ohc
            WHERE ohc.id = conversation_id 
            AND (ohc.student_id = auth.uid() OR ohc.teacher_id = auth.uid())
        )
    );

CREATE POLICY "Students can send messages in their conversations" ON office_hours_messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        sender_type = 'student' AND
        EXISTS (
            SELECT 1 FROM office_hours_conversations ohc, profiles p
            WHERE ohc.id = conversation_id 
            AND ohc.student_id = auth.uid()
            AND ohc.status = 'active'
            AND p.id = auth.uid()
            AND p.role = 'student'
        )
    );

CREATE POLICY "Teachers can send messages in their conversations" ON office_hours_messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        sender_type = 'teacher' AND
        EXISTS (
            SELECT 1 FROM office_hours_conversations ohc, profiles p
            WHERE ohc.id = conversation_id 
            AND ohc.teacher_id = auth.uid()
            AND ohc.status = 'active'
            AND p.id = auth.uid()
            AND p.role = 'teacher'
        )
    );

CREATE POLICY "Participants can update message read status" ON office_hours_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM office_hours_conversations ohc
            WHERE ohc.id = conversation_id 
            AND (ohc.student_id = auth.uid() OR ohc.teacher_id = auth.uid())
        )
    );

CREATE POLICY "Admins can view messages in their school" ON office_hours_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin' 
            AND school_id = office_hours_messages.school_id
        )
    );

-- Moderation Log Policies
ALTER TABLE office_hours_moderation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view moderation logs in their school" ON office_hours_moderation_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin' 
            AND school_id = office_hours_moderation_log.school_id
        )
    );

CREATE POLICY "System can insert moderation logs" ON office_hours_moderation_log
    FOR INSERT WITH CHECK (true);

-- Notifications Policies
ALTER TABLE office_hours_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON office_hours_notifications
    FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update their own notifications" ON office_hours_notifications
    FOR UPDATE USING (auth.uid() = recipient_id);

CREATE POLICY "System can create notifications" ON office_hours_notifications
    FOR INSERT WITH CHECK (true);

-- Triggers for Updated At Timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_teacher_office_hours_updated_at 
    BEFORE UPDATE ON teacher_office_hours 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_office_hours_conversations_updated_at 
    BEFORE UPDATE ON office_hours_conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_office_hours_messages_updated_at 
    BEFORE UPDATE ON office_hours_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically end conversations after office hours
CREATE OR REPLACE FUNCTION end_conversations_after_office_hours()
RETURNS void AS $$
BEGIN
    UPDATE office_hours_conversations 
    SET status = 'ended', 
        ended_at = NOW(), 
        end_reason = 'Office hours ended'
    WHERE status = 'active' 
    AND NOT EXISTS (
        SELECT 1 FROM teacher_office_hours toh
        WHERE toh.teacher_id = office_hours_conversations.teacher_id
        AND toh.day_of_week = to_char(NOW(), 'Day')
        AND toh.start_time <= CURRENT_TIME
        AND toh.end_time >= CURRENT_TIME
        AND toh.is_active = true
    );
END;
$$ LANGUAGE plpgsql;

-- Sample Office Hours Data (for testing)
INSERT INTO teacher_office_hours (teacher_id, day_of_week, start_time, end_time, school_id)
SELECT 
    p.id,
    'Monday',
    '14:00',
    '16:00',
    p.school_id
FROM profiles p 
WHERE p.role = 'teacher' 
AND NOT EXISTS (
    SELECT 1 FROM teacher_office_hours toh 
    WHERE toh.teacher_id = p.id 
    AND toh.day_of_week = 'Monday'
)
LIMIT 5;

INSERT INTO teacher_office_hours (teacher_id, day_of_week, start_time, end_time, school_id)
SELECT 
    p.id,
    'Wednesday',
    '15:00',
    '17:00',
    p.school_id
FROM profiles p 
WHERE p.role = 'teacher' 
AND NOT EXISTS (
    SELECT 1 FROM teacher_office_hours toh 
    WHERE toh.teacher_id = p.id 
    AND toh.day_of_week = 'Wednesday'
)
LIMIT 5;

INSERT INTO teacher_office_hours (teacher_id, day_of_week, start_time, end_time, school_id)
SELECT 
    p.id,
    'Friday',
    '13:00',
    '15:00',
    p.school_id
FROM profiles p 
WHERE p.role = 'teacher' 
AND NOT EXISTS (
    SELECT 1 FROM teacher_office_hours toh 
    WHERE toh.teacher_id = p.id 
    AND toh.day_of_week = 'Friday'
)
LIMIT 5;
