-- Intervention Toolkit Database Schema
-- Tracks intervention implementations, effectiveness, and teacher analytics

-- Intervention Implementations Table
CREATE TABLE IF NOT EXISTS intervention_implementations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    activity_id TEXT NOT NULL,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    teacher_name TEXT NOT NULL,
    implementation_notes TEXT,
    effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
    student_feedback TEXT,
    duration_minutes INTEGER,
    class_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teacher Intervention Stats Table
CREATE TABLE IF NOT EXISTS teacher_intervention_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    total_interventions INTEGER DEFAULT 0,
    last_intervention_date TIMESTAMP WITH TIME ZONE,
    favorite_activities TEXT[],
    most_effective_category TEXT,
    average_effectiveness DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(teacher_id)
);

-- Student Mood Tracking Table (if not exists from previous schemas)
CREATE TABLE IF NOT EXISTS student_moods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    mood_emoji TEXT NOT NULL,
    mood_intensity INTEGER CHECK (mood_intensity >= 1 AND mood_intensity <= 10),
    context TEXT,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Notifications Table (if not exists)
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('intervention_implemented', 'high_risk_detected', 'system_alert', 'teacher_request')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT false,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Intervention Activity Feedback Table
CREATE TABLE IF NOT EXISTS intervention_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    implementation_id UUID NOT NULL REFERENCES intervention_implementations(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('effectiveness', 'engagement', 'mood_change', 'suggestion')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    anonymous BOOLEAN DEFAULT true,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Intervention Recommendations Table
CREATE TABLE IF NOT EXISTS intervention_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    activity_id TEXT NOT NULL,
    relevance_score INTEGER NOT NULL,
    reasoning TEXT NOT NULL,
    urgency_level TEXT NOT NULL CHECK (urgency_level IN ('low', 'medium', 'high')),
    class_analytics JSONB,
    is_implemented BOOLEAN DEFAULT false,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_intervention_implementations_teacher ON intervention_implementations(teacher_id, created_at);
CREATE INDEX IF NOT EXISTS idx_intervention_implementations_school ON intervention_implementations(school_id, created_at);
CREATE INDEX IF NOT EXISTS idx_intervention_implementations_activity ON intervention_implementations(activity_id, created_at);
CREATE INDEX IF NOT EXISTS idx_teacher_intervention_stats_teacher ON teacher_intervention_stats(teacher_id);
CREATE INDEX IF NOT EXISTS idx_student_moods_student_date ON student_moods(student_id, created_at);
CREATE INDEX IF NOT EXISTS idx_student_moods_school_date ON student_moods(school_id, created_at);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_school ON admin_notifications(school_id, is_read, created_at);
CREATE INDEX IF NOT EXISTS idx_intervention_feedback_implementation ON intervention_feedback(implementation_id);
CREATE INDEX IF NOT EXISTS idx_intervention_recommendations_teacher ON intervention_recommendations(teacher_id, expires_at);

-- Row Level Security Policies

-- Intervention Implementations Policies
ALTER TABLE intervention_implementations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view their own implementations" ON intervention_implementations
    FOR SELECT USING (
        auth.uid() = teacher_id AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
    );

CREATE POLICY "Teachers can create their own implementations" ON intervention_implementations
    FOR INSERT WITH CHECK (
        auth.uid() = teacher_id AND 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'teacher' 
            AND school_id = intervention_implementations.school_id
        )
    );

CREATE POLICY "Teachers can update their own implementations" ON intervention_implementations
    FOR UPDATE USING (
        auth.uid() = teacher_id AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
    );

CREATE POLICY "Admins can view implementations in their school" ON intervention_implementations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin' 
            AND school_id = intervention_implementations.school_id
        )
    );

-- Teacher Intervention Stats Policies
ALTER TABLE teacher_intervention_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view their own stats" ON teacher_intervention_stats
    FOR SELECT USING (
        auth.uid() = teacher_id AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
    );

CREATE POLICY "System can manage teacher stats" ON teacher_intervention_stats
    FOR ALL USING (true);

CREATE POLICY "Admins can view teacher stats in their school" ON teacher_intervention_stats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin' 
            AND school_id = teacher_intervention_stats.school_id
        )
    );

-- Student Moods Policies (if table was just created)
ALTER TABLE student_moods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage their own moods" ON student_moods
    FOR ALL USING (
        auth.uid() = student_id AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student')
    );

CREATE POLICY "Teachers can view student moods in their school" ON student_moods
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'teacher' 
            AND school_id = student_moods.school_id
        )
    );

CREATE POLICY "Admins can view student moods in their school" ON student_moods
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin' 
            AND school_id = student_moods.school_id
        )
    );

-- Admin Notifications Policies
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view notifications in their school" ON admin_notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin' 
            AND school_id = admin_notifications.school_id
        )
    );

CREATE POLICY "Admins can update notifications in their school" ON admin_notifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin' 
            AND school_id = admin_notifications.school_id
        )
    );

CREATE POLICY "System can create notifications" ON admin_notifications
    FOR INSERT WITH CHECK (true);

-- Intervention Feedback Policies
ALTER TABLE intervention_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can create feedback for interventions in their school" ON intervention_feedback
    FOR INSERT WITH CHECK (
        (student_id IS NULL OR auth.uid() = student_id) AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND school_id = intervention_feedback.school_id
        )
    );

CREATE POLICY "Teachers can view feedback for their implementations" ON intervention_feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM intervention_implementations ii, profiles p
            WHERE ii.id = intervention_feedback.implementation_id
            AND ii.teacher_id = auth.uid()
            AND p.id = auth.uid()
            AND p.role = 'teacher'
        )
    );

CREATE POLICY "Admins can view feedback in their school" ON intervention_feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin' 
            AND school_id = intervention_feedback.school_id
        )
    );

-- Intervention Recommendations Policies
ALTER TABLE intervention_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view their own recommendations" ON intervention_recommendations
    FOR SELECT USING (
        auth.uid() = teacher_id AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
    );

CREATE POLICY "System can create recommendations" ON intervention_recommendations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Teachers can update their own recommendations" ON intervention_recommendations
    FOR UPDATE USING (
        auth.uid() = teacher_id AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
    );

-- Triggers for Updated At Timestamps
CREATE OR REPLACE TRIGGER update_intervention_implementations_updated_at 
    BEFORE UPDATE ON intervention_implementations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_teacher_intervention_stats_updated_at 
    BEFORE UPDATE ON teacher_intervention_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to Update Teacher Stats After Implementation
CREATE OR REPLACE FUNCTION update_teacher_intervention_stats_after_implementation()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert teacher stats
    INSERT INTO teacher_intervention_stats (
        teacher_id,
        school_id,
        total_interventions,
        last_intervention_date
    )
    VALUES (
        NEW.teacher_id,
        NEW.school_id,
        1,
        NEW.created_at
    )
    ON CONFLICT (teacher_id) DO UPDATE SET
        total_interventions = teacher_intervention_stats.total_interventions + 1,
        last_intervention_date = NEW.created_at,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update stats
CREATE OR REPLACE TRIGGER trigger_update_teacher_stats
    AFTER INSERT ON intervention_implementations
    FOR EACH ROW EXECUTE FUNCTION update_teacher_intervention_stats_after_implementation();

-- Function to Clean Up Expired Recommendations
CREATE OR REPLACE FUNCTION cleanup_expired_recommendations()
RETURNS void AS $$
BEGIN
    DELETE FROM intervention_recommendations 
    WHERE expires_at < NOW() 
    AND is_implemented = false;
END;
$$ LANGUAGE plpgsql;

-- Sample Data for Testing
INSERT INTO student_moods (student_id, mood_emoji, mood_intensity, school_id)
SELECT 
    p.id,
    CASE 
        WHEN random() < 0.3 THEN '😢'
        WHEN random() < 0.5 THEN '😰'
        WHEN random() < 0.7 THEN '😌'
        ELSE '😊'
    END,
    floor(random() * 10 + 1)::integer,
    p.school_id
FROM profiles p 
WHERE p.role = 'student' 
AND NOT EXISTS (
    SELECT 1 FROM student_moods sm 
    WHERE sm.student_id = p.id 
    AND sm.created_at > NOW() - INTERVAL '1 hour'
)
LIMIT 20;
