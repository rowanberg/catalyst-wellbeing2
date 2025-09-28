-- Parent Communication System Schema
-- Comprehensive messaging, announcements, and scheduling system

-- Parent-Teacher Direct Messages
CREATE TABLE parent_teacher_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('teacher', 'parent')),
    is_read BOOLEAN DEFAULT FALSE,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    attachments JSONB DEFAULT '[]',
    reply_to_id UUID REFERENCES parent_teacher_messages(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Class Announcements
CREATE TABLE class_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    announcement_type VARCHAR(30) DEFAULT 'general' CHECK (announcement_type IN ('general', 'homework', 'event', 'reminder', 'urgent')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    attachments JSONB DEFAULT '[]',
    target_audience VARCHAR(20) DEFAULT 'all_parents' CHECK (target_audience IN ('all_parents', 'specific_parents', 'class_parents')),
    specific_parent_ids UUID[] DEFAULT '{}',
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Announcement Read Status
CREATE TABLE announcement_read_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID NOT NULL REFERENCES class_announcements(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(announcement_id, parent_id)
);

-- Parent-Teacher Meeting Scheduler
CREATE TABLE meeting_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    meeting_type VARCHAR(30) DEFAULT 'conference' CHECK (meeting_type IN ('conference', 'consultation', 'progress_review', 'behavioral_discussion')),
    location VARCHAR(200),
    virtual_meeting_link VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE meeting_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_id UUID NOT NULL REFERENCES meeting_slots(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject VARCHAR(200) NOT NULL,
    agenda TEXT,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled')),
    reminder_sent BOOLEAN DEFAULT FALSE,
    meeting_notes TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Automated Notification Rules
CREATE TABLE notification_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    rule_name VARCHAR(100) NOT NULL,
    trigger_type VARCHAR(30) NOT NULL CHECK (trigger_type IN ('attendance', 'grade', 'behavior', 'homework', 'mood', 'achievement')),
    trigger_conditions JSONB NOT NULL, -- e.g., {"attendance_below": 80, "consecutive_days": 3}
    notification_template TEXT NOT NULL,
    notification_method VARCHAR(20) DEFAULT 'message' CHECK (notification_method IN ('message', 'email', 'sms', 'push')),
    is_active BOOLEAN DEFAULT TRUE,
    frequency VARCHAR(20) DEFAULT 'immediate' CHECK (frequency IN ('immediate', 'daily', 'weekly', 'monthly')),
    last_triggered TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification History
CREATE TABLE notification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID REFERENCES notification_rules(id) ON DELETE SET NULL,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    notification_type VARCHAR(30) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    method VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_parent_teacher_messages_teacher ON parent_teacher_messages(teacher_id, created_at DESC);
CREATE INDEX idx_parent_teacher_messages_parent ON parent_teacher_messages(parent_id, created_at DESC);
CREATE INDEX idx_parent_teacher_messages_student ON parent_teacher_messages(student_id, created_at DESC);
CREATE INDEX idx_class_announcements_class ON class_announcements(class_id, created_at DESC);
CREATE INDEX idx_class_announcements_teacher ON class_announcements(teacher_id, created_at DESC);
CREATE INDEX idx_meeting_slots_teacher_date ON meeting_slots(teacher_id, date, start_time);
CREATE INDEX idx_meeting_bookings_parent ON meeting_bookings(parent_id, created_at DESC);
CREATE INDEX idx_notification_rules_teacher ON notification_rules(teacher_id, is_active);
CREATE INDEX idx_notification_history_parent ON notification_history(parent_id, sent_at DESC);

-- Row Level Security
ALTER TABLE parent_teacher_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_read_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Teachers can manage their messages" ON parent_teacher_messages
    FOR ALL USING (
        teacher_id IN (
            SELECT t.id FROM teachers t 
            WHERE t.user_id = auth.uid() AND t.school_id = parent_teacher_messages.school_id
        )
    );

CREATE POLICY "Parents can view their messages" ON parent_teacher_messages
    FOR SELECT USING (
        parent_id IN (
            SELECT p.id FROM parents p 
            WHERE p.user_id = auth.uid() AND p.school_id = parent_teacher_messages.school_id
        )
    );

CREATE POLICY "Teachers can manage their announcements" ON class_announcements
    FOR ALL USING (
        teacher_id IN (
            SELECT t.id FROM teachers t 
            WHERE t.user_id = auth.uid() AND t.school_id = class_announcements.school_id
        )
    );

CREATE POLICY "Parents can view class announcements" ON class_announcements
    FOR SELECT USING (
        class_id IN (
            SELECT s.class_id FROM students s
            JOIN parents p ON p.id = s.parent_id
            WHERE p.user_id = auth.uid() AND s.school_id = class_announcements.school_id
        )
    );

CREATE POLICY "Teachers can manage their meeting slots" ON meeting_slots
    FOR ALL USING (
        teacher_id IN (
            SELECT t.id FROM teachers t 
            WHERE t.user_id = auth.uid() AND t.school_id = meeting_slots.school_id
        )
    );

CREATE POLICY "Parents can view available slots and their bookings" ON meeting_bookings
    FOR ALL USING (
        parent_id IN (
            SELECT p.id FROM parents p 
            WHERE p.user_id = auth.uid()
        )
    );

CREATE POLICY "Teachers can manage notification rules" ON notification_rules
    FOR ALL USING (
        teacher_id IN (
            SELECT t.id FROM teachers t 
            WHERE t.user_id = auth.uid() AND t.school_id = notification_rules.school_id
        )
    );

-- Functions
CREATE OR REPLACE FUNCTION get_teacher_messages(teacher_uuid UUID, limit_count INT DEFAULT 50)
RETURNS TABLE (
    message_id UUID,
    parent_name TEXT,
    student_name TEXT,
    subject TEXT,
    message TEXT,
    sender_type TEXT,
    is_read BOOLEAN,
    priority TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    reply_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ptm.id,
        p.full_name,
        s.full_name,
        ptm.subject,
        ptm.message,
        ptm.sender_type,
        ptm.is_read,
        ptm.priority,
        ptm.created_at,
        (SELECT COUNT(*) FROM parent_teacher_messages replies WHERE replies.reply_to_id = ptm.id)
    FROM parent_teacher_messages ptm
    JOIN parents p ON p.id = ptm.parent_id
    JOIN students s ON s.id = ptm.student_id
    WHERE ptm.teacher_id = teacher_uuid
    ORDER BY ptm.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_class_announcements(class_uuid UUID, limit_count INT DEFAULT 20)
RETURNS TABLE (
    announcement_id UUID,
    title TEXT,
    content TEXT,
    announcement_type TEXT,
    priority TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    read_count BIGINT,
    total_parents BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ca.id,
        ca.title,
        ca.content,
        ca.announcement_type,
        ca.priority,
        ca.created_at,
        (SELECT COUNT(*) FROM announcement_read_status ars WHERE ars.announcement_id = ca.id),
        (SELECT COUNT(DISTINCT s.parent_id) FROM students s WHERE s.class_id = class_uuid)
    FROM class_announcements ca
    WHERE ca.class_id = class_uuid AND ca.is_published = TRUE
    ORDER BY ca.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_available_meeting_slots(teacher_uuid UUID, start_date DATE, end_date DATE)
RETURNS TABLE (
    slot_id UUID,
    date DATE,
    start_time TIME,
    end_time TIME,
    meeting_type TEXT,
    location TEXT,
    is_booked BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ms.id,
        ms.date,
        ms.start_time,
        ms.end_time,
        ms.meeting_type,
        ms.location,
        EXISTS(SELECT 1 FROM meeting_bookings mb WHERE mb.slot_id = ms.id AND mb.status NOT IN ('cancelled'))
    FROM meeting_slots ms
    WHERE ms.teacher_id = teacher_uuid 
    AND ms.date BETWEEN start_date AND end_date
    AND ms.is_available = TRUE
    ORDER BY ms.date, ms.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
