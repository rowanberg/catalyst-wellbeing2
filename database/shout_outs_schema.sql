-- Student Shout-Outs System Database Schema
-- Enables teachers to give positive recognition to students

-- Student Shout-Outs Table
CREATE TABLE IF NOT EXISTS student_shout_outs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('academic', 'behavior', 'kindness', 'effort', 'leadership', 'creativity')),
    message TEXT NOT NULL CHECK (length(message) <= 500 AND length(message) > 0),
    is_public BOOLEAN DEFAULT true,
    badge TEXT,
    template_id TEXT,
    reactions INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student Recognition Stats Table
CREATE TABLE IF NOT EXISTS student_recognition_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    total_shout_outs INTEGER DEFAULT 0,
    last_recognition_date TIMESTAMP WITH TIME ZONE,
    categories_received TEXT[] DEFAULT '{}',
    favorite_category TEXT,
    recognition_streak INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(student_id)
);

-- Student Notifications Table (if not exists)
CREATE TABLE IF NOT EXISTS student_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('shout_out_received', 'xp_earned', 'badge_unlocked', 'quest_completed', 'announcement')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    is_read BOOLEAN DEFAULT false,
    xp_reward INTEGER DEFAULT 0,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Class Announcements Table (if not exists)
CREATE TABLE IF NOT EXISTS class_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'general' CHECK (type IN ('general', 'recognition', 'reminder', 'celebration')),
    target_audience TEXT DEFAULT 'class' CHECK (target_audience IN ('class', 'grade', 'school')),
    is_pinned BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shout-Out Reactions Table
CREATE TABLE IF NOT EXISTS shout_out_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shout_out_id UUID NOT NULL REFERENCES student_shout_outs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reaction_type TEXT DEFAULT 'heart' CHECK (reaction_type IN ('heart', 'star', 'clap', 'fire')),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(shout_out_id, user_id)
);

-- Shout-Out Templates Table (for custom school templates)
CREATE TABLE IF NOT EXISTS shout_out_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('academic', 'behavior', 'kindness', 'effort', 'leadership', 'creativity')),
    title TEXT NOT NULL,
    message TEXT NOT NULL CHECK (length(message) <= 500),
    badge TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_student_shout_outs_student ON student_shout_outs(student_id, created_at);
CREATE INDEX IF NOT EXISTS idx_student_shout_outs_teacher ON student_shout_outs(teacher_id, created_at);
CREATE INDEX IF NOT EXISTS idx_student_shout_outs_school ON student_shout_outs(school_id, created_at);
CREATE INDEX IF NOT EXISTS idx_student_shout_outs_category ON student_shout_outs(category, created_at);
CREATE INDEX IF NOT EXISTS idx_student_shout_outs_public ON student_shout_outs(is_public, created_at) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_student_recognition_stats_student ON student_recognition_stats(student_id);
CREATE INDEX IF NOT EXISTS idx_student_notifications_student ON student_notifications(student_id, is_read, created_at);
CREATE INDEX IF NOT EXISTS idx_class_announcements_school ON class_announcements(school_id, created_at);
CREATE INDEX IF NOT EXISTS idx_shout_out_reactions_shout_out ON shout_out_reactions(shout_out_id);
CREATE INDEX IF NOT EXISTS idx_shout_out_templates_school ON shout_out_templates(school_id, is_active);

-- Row Level Security Policies

-- Student Shout-Outs Policies
ALTER TABLE student_shout_outs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view shout-outs about themselves" ON student_shout_outs
    FOR SELECT USING (
        auth.uid() = student_id AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student')
    );

CREATE POLICY "Teachers can view shout-outs in their school" ON student_shout_outs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'teacher' 
            AND school_id = student_shout_outs.school_id
        )
    );

CREATE POLICY "Teachers can create shout-outs for students in their school" ON student_shout_outs
    FOR INSERT WITH CHECK (
        auth.uid() = teacher_id AND 
        EXISTS (
            SELECT 1 FROM profiles p1, profiles p2
            WHERE p1.id = auth.uid() 
            AND p1.role = 'teacher' 
            AND p2.id = student_id 
            AND p2.role = 'student' 
            AND p1.school_id = p2.school_id
            AND p1.school_id = student_shout_outs.school_id
        )
    );

CREATE POLICY "Teachers can update their own shout-outs" ON student_shout_outs
    FOR UPDATE USING (
        auth.uid() = teacher_id AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
    );

CREATE POLICY "Public shout-outs visible to school community" ON student_shout_outs
    FOR SELECT USING (
        is_public = true AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND school_id = student_shout_outs.school_id
        )
    );

CREATE POLICY "Admins can view all shout-outs in their school" ON student_shout_outs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin' 
            AND school_id = student_shout_outs.school_id
        )
    );

-- Student Recognition Stats Policies
ALTER TABLE student_recognition_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own recognition stats" ON student_recognition_stats
    FOR SELECT USING (
        auth.uid() = student_id AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student')
    );

CREATE POLICY "Teachers can view recognition stats in their school" ON student_recognition_stats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'teacher' 
            AND school_id = student_recognition_stats.school_id
        )
    );

CREATE POLICY "System can manage recognition stats" ON student_recognition_stats
    FOR ALL USING (true);

-- Student Notifications Policies
ALTER TABLE student_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own notifications" ON student_notifications
    FOR SELECT USING (
        auth.uid() = student_id AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student')
    );

CREATE POLICY "Students can update their own notifications" ON student_notifications
    FOR UPDATE USING (
        auth.uid() = student_id AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student')
    );

CREATE POLICY "System can create notifications" ON student_notifications
    FOR INSERT WITH CHECK (true);

-- Class Announcements Policies
ALTER TABLE class_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School community can view announcements" ON class_announcements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND school_id = class_announcements.school_id
        )
    );

CREATE POLICY "Teachers can create announcements" ON class_announcements
    FOR INSERT WITH CHECK (
        auth.uid() = teacher_id AND 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'teacher' 
            AND school_id = class_announcements.school_id
        )
    );

CREATE POLICY "Teachers can update their own announcements" ON class_announcements
    FOR UPDATE USING (
        auth.uid() = teacher_id AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
    );

-- Shout-Out Reactions Policies
ALTER TABLE shout_out_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School community can view reactions" ON shout_out_reactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND school_id = shout_out_reactions.school_id
        )
    );

CREATE POLICY "School community can create reactions" ON shout_out_reactions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND school_id = shout_out_reactions.school_id
        )
    );

CREATE POLICY "Users can delete their own reactions" ON shout_out_reactions
    FOR DELETE USING (
        auth.uid() = user_id
    );

-- Shout-Out Templates Policies
ALTER TABLE shout_out_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view templates in their school" ON shout_out_templates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('teacher', 'admin') 
            AND school_id = shout_out_templates.school_id
        )
    );

CREATE POLICY "Teachers can create templates for their school" ON shout_out_templates
    FOR INSERT WITH CHECK (
        auth.uid() = created_by AND 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'teacher' 
            AND school_id = shout_out_templates.school_id
        )
    );

CREATE POLICY "Template creators can update their templates" ON shout_out_templates
    FOR UPDATE USING (
        auth.uid() = created_by AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
    );

-- Triggers for Updated At Timestamps
CREATE OR REPLACE TRIGGER update_student_shout_outs_updated_at 
    BEFORE UPDATE ON student_shout_outs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_student_recognition_stats_updated_at 
    BEFORE UPDATE ON student_recognition_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_class_announcements_updated_at 
    BEFORE UPDATE ON class_announcements 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_shout_out_templates_updated_at 
    BEFORE UPDATE ON shout_out_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to Update Recognition Stats After Shout-Out
CREATE OR REPLACE FUNCTION update_recognition_stats_after_shout_out()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert student recognition stats
    INSERT INTO student_recognition_stats (
        student_id,
        school_id,
        total_shout_outs,
        last_recognition_date,
        categories_received
    )
    VALUES (
        NEW.student_id,
        NEW.school_id,
        1,
        NEW.created_at,
        ARRAY[NEW.category]
    )
    ON CONFLICT (student_id) DO UPDATE SET
        total_shout_outs = student_recognition_stats.total_shout_outs + 1,
        last_recognition_date = NEW.created_at,
        categories_received = array_append(
            CASE 
                WHEN NEW.category = ANY(student_recognition_stats.categories_received) 
                THEN student_recognition_stats.categories_received
                ELSE array_append(student_recognition_stats.categories_received, NEW.category)
            END,
            NEW.category
        ),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to Update Reaction Count
CREATE OR REPLACE FUNCTION update_shout_out_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE student_shout_outs 
        SET reactions = reactions + 1 
        WHERE id = NEW.shout_out_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE student_shout_outs 
        SET reactions = GREATEST(reactions - 1, 0) 
        WHERE id = OLD.shout_out_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE OR REPLACE TRIGGER trigger_update_recognition_stats
    AFTER INSERT ON student_shout_outs
    FOR EACH ROW EXECUTE FUNCTION update_recognition_stats_after_shout_out();

CREATE OR REPLACE TRIGGER trigger_update_reaction_count_insert
    AFTER INSERT ON shout_out_reactions
    FOR EACH ROW EXECUTE FUNCTION update_shout_out_reaction_count();

CREATE OR REPLACE TRIGGER trigger_update_reaction_count_delete
    AFTER DELETE ON shout_out_reactions
    FOR EACH ROW EXECUTE FUNCTION update_shout_out_reaction_count();

-- Sample Data for Testing
INSERT INTO student_shout_outs (student_id, teacher_id, school_id, category, message, is_public, badge)
SELECT 
    s.id,
    t.id,
    s.school_id,
    CASE 
        WHEN random() < 0.2 THEN 'academic'
        WHEN random() < 0.4 THEN 'behavior'
        WHEN random() < 0.6 THEN 'kindness'
        WHEN random() < 0.8 THEN 'effort'
        ELSE 'creativity'
    END,
    CASE 
        WHEN random() < 0.3 THEN 'showed excellent participation in class today!'
        WHEN random() < 0.6 THEN 'helped a classmate and demonstrated great kindness!'
        ELSE 'put in amazing effort on their assignment!'
    END,
    random() < 0.8, -- 80% public
    CASE 
        WHEN random() < 0.2 THEN '🏆'
        WHEN random() < 0.4 THEN '⭐'
        WHEN random() < 0.6 THEN '💝'
        WHEN random() < 0.8 THEN '💪'
        ELSE '🎨'
    END
FROM profiles s
CROSS JOIN profiles t
WHERE s.role = 'student' 
AND t.role = 'teacher'
AND s.school_id = t.school_id
AND NOT EXISTS (
    SELECT 1 FROM student_shout_outs so 
    WHERE so.student_id = s.id 
    AND so.created_at > NOW() - INTERVAL '1 day'
)
LIMIT 10;
