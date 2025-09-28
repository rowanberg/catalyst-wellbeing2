-- Quest and Badge Creator System Database Schema
-- Enables teachers to create custom learning challenges and achievements

-- Custom Quests Table
CREATE TABLE IF NOT EXISTS custom_quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL CHECK (length(title) <= 200 AND length(title) > 0),
    description TEXT NOT NULL CHECK (length(description) <= 1000 AND length(description) > 0),
    category TEXT NOT NULL CHECK (category IN ('academic', 'behavior', 'social', 'creative')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    xp_reward INTEGER NOT NULL CHECK (xp_reward > 0 AND xp_reward <= 1000),
    gem_reward INTEGER NOT NULL CHECK (gem_reward > 0 AND gem_reward <= 100),
    requirements TEXT[] NOT NULL DEFAULT '{}',
    time_limit INTEGER CHECK (time_limit > 0), -- in days
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Custom Badges Table
CREATE TABLE IF NOT EXISTS custom_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (length(name) <= 100 AND length(name) > 0),
    description TEXT NOT NULL CHECK (length(description) <= 500 AND length(description) > 0),
    icon TEXT NOT NULL DEFAULT '🏆',
    color TEXT NOT NULL DEFAULT '#3B82F6',
    criteria TEXT[] NOT NULL DEFAULT '{}',
    rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    awarded_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student Quest Progress Table
CREATE TABLE IF NOT EXISTS student_quest_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    quest_id UUID NOT NULL REFERENCES custom_quests(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'abandoned')),
    progress_data JSONB DEFAULT '{}',
    requirements_completed TEXT[] DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    deadline TIMESTAMP WITH TIME ZONE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    UNIQUE(student_id, quest_id)
);

-- Student Badge Achievements Table
CREATE TABLE IF NOT EXISTS student_badge_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES custom_badges(id) ON DELETE CASCADE,
    awarded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason TEXT,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    UNIQUE(student_id, badge_id)
);

-- Quest Templates Table (for sharing between teachers)
CREATE TABLE IF NOT EXISTS quest_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('academic', 'behavior', 'social', 'creative')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    suggested_xp_reward INTEGER NOT NULL,
    suggested_gem_reward INTEGER NOT NULL,
    requirements_template TEXT[] NOT NULL DEFAULT '{}',
    suggested_time_limit INTEGER,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE, -- NULL for system-wide templates
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Badge Templates Table
CREATE TABLE IF NOT EXISTS badge_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '🏆',
    color TEXT NOT NULL DEFAULT '#3B82F6',
    criteria_template TEXT[] NOT NULL DEFAULT '{}',
    rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE, -- NULL for system-wide templates
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quest Submissions Table (for teacher review)
CREATE TABLE IF NOT EXISTS quest_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quest_progress_id UUID NOT NULL REFERENCES student_quest_progress(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    quest_id UUID NOT NULL REFERENCES custom_quests(id) ON DELETE CASCADE,
    submission_data JSONB NOT NULL DEFAULT '{}',
    submission_text TEXT,
    attachments TEXT[], -- URLs to uploaded files
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected', 'needs_revision')),
    review_feedback TEXT,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_custom_quests_creator ON custom_quests(created_by, created_at);
CREATE INDEX IF NOT EXISTS idx_custom_quests_school ON custom_quests(school_id, is_active);
CREATE INDEX IF NOT EXISTS idx_custom_quests_category ON custom_quests(category, difficulty);
CREATE INDEX IF NOT EXISTS idx_custom_badges_creator ON custom_badges(created_by, created_at);
CREATE INDEX IF NOT EXISTS idx_custom_badges_school ON custom_badges(school_id, is_active);
CREATE INDEX IF NOT EXISTS idx_student_quest_progress_student ON student_quest_progress(student_id, status);
CREATE INDEX IF NOT EXISTS idx_student_quest_progress_quest ON student_quest_progress(quest_id, status);
CREATE INDEX IF NOT EXISTS idx_student_badge_achievements_student ON student_badge_achievements(student_id, awarded_at);
CREATE INDEX IF NOT EXISTS idx_student_badge_achievements_badge ON student_badge_achievements(badge_id, awarded_at);
CREATE INDEX IF NOT EXISTS idx_quest_templates_public ON quest_templates(is_public, school_id) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_badge_templates_public ON badge_templates(is_public, school_id) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_quest_submissions_review ON quest_submissions(review_status, submitted_at);

-- Row Level Security Policies

-- Custom Quests Policies
ALTER TABLE custom_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view their own quests" ON custom_quests
    FOR SELECT USING (
        auth.uid() = created_by AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
    );

CREATE POLICY "Teachers can create quests for their school" ON custom_quests
    FOR INSERT WITH CHECK (
        auth.uid() = created_by AND 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'teacher' 
            AND school_id = custom_quests.school_id
        )
    );

CREATE POLICY "Teachers can update their own quests" ON custom_quests
    FOR UPDATE USING (
        auth.uid() = created_by AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
    );

CREATE POLICY "Teachers can delete their own quests" ON custom_quests
    FOR DELETE USING (
        auth.uid() = created_by AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
    );

CREATE POLICY "Students can view active quests in their school" ON custom_quests
    FOR SELECT USING (
        is_active = true AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'student' 
            AND school_id = custom_quests.school_id
        )
    );

CREATE POLICY "Admins can view all quests in their school" ON custom_quests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin' 
            AND school_id = custom_quests.school_id
        )
    );

-- Custom Badges Policies
ALTER TABLE custom_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view their own badges" ON custom_badges
    FOR SELECT USING (
        auth.uid() = created_by AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
    );

CREATE POLICY "Teachers can create badges for their school" ON custom_badges
    FOR INSERT WITH CHECK (
        auth.uid() = created_by AND 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'teacher' 
            AND school_id = custom_badges.school_id
        )
    );

CREATE POLICY "Teachers can update their own badges" ON custom_badges
    FOR UPDATE USING (
        auth.uid() = created_by AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
    );

CREATE POLICY "Teachers can delete their own badges" ON custom_badges
    FOR DELETE USING (
        auth.uid() = created_by AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
    );

CREATE POLICY "School community can view active badges" ON custom_badges
    FOR SELECT USING (
        is_active = true AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND school_id = custom_badges.school_id
        )
    );

-- Student Quest Progress Policies
ALTER TABLE student_quest_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own quest progress" ON student_quest_progress
    FOR SELECT USING (
        auth.uid() = student_id AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student')
    );

CREATE POLICY "Students can update their own quest progress" ON student_quest_progress
    FOR UPDATE USING (
        auth.uid() = student_id AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student')
    );

CREATE POLICY "System can manage quest progress" ON student_quest_progress
    FOR ALL USING (true);

CREATE POLICY "Teachers can view quest progress in their school" ON student_quest_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'teacher' 
            AND school_id = student_quest_progress.school_id
        )
    );

-- Student Badge Achievements Policies
ALTER TABLE student_badge_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own badge achievements" ON student_badge_achievements
    FOR SELECT USING (
        auth.uid() = student_id AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student')
    );

CREATE POLICY "Teachers can award badges to students in their school" ON student_badge_achievements
    FOR INSERT WITH CHECK (
        auth.uid() = awarded_by AND 
        EXISTS (
            SELECT 1 FROM profiles p1, profiles p2
            WHERE p1.id = auth.uid() 
            AND p1.role = 'teacher' 
            AND p2.id = student_id 
            AND p2.role = 'student' 
            AND p1.school_id = p2.school_id
            AND p1.school_id = student_badge_achievements.school_id
        )
    );

CREATE POLICY "School community can view badge achievements" ON student_badge_achievements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND school_id = student_badge_achievements.school_id
        )
    );

-- Quest Submissions Policies
ALTER TABLE quest_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can create their own quest submissions" ON quest_submissions
    FOR INSERT WITH CHECK (
        auth.uid() = student_id AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student')
    );

CREATE POLICY "Students can view their own quest submissions" ON quest_submissions
    FOR SELECT USING (
        auth.uid() = student_id AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student')
    );

CREATE POLICY "Teachers can review quest submissions in their school" ON quest_submissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'teacher' 
            AND school_id = quest_submissions.school_id
        )
    );

-- Triggers for Updated At Timestamps
CREATE OR REPLACE TRIGGER update_custom_quests_updated_at 
    BEFORE UPDATE ON custom_quests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_custom_badges_updated_at 
    BEFORE UPDATE ON custom_badges 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_quest_templates_updated_at 
    BEFORE UPDATE ON quest_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_badge_templates_updated_at 
    BEFORE UPDATE ON badge_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to Update Badge Awarded Count
CREATE OR REPLACE FUNCTION update_badge_awarded_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE custom_badges 
        SET awarded_count = awarded_count + 1 
        WHERE id = NEW.badge_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE custom_badges 
        SET awarded_count = GREATEST(awarded_count - 1, 0) 
        WHERE id = OLD.badge_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to Auto-assign Quests to Students
CREATE OR REPLACE FUNCTION auto_assign_quest_to_students()
RETURNS TRIGGER AS $$
BEGIN
    -- When a new quest is created and is active, assign it to all students in the school
    IF NEW.is_active = true THEN
        INSERT INTO student_quest_progress (student_id, quest_id, school_id, deadline)
        SELECT 
            p.id,
            NEW.id,
            NEW.school_id,
            CASE 
                WHEN NEW.time_limit IS NOT NULL 
                THEN NOW() + (NEW.time_limit || ' days')::INTERVAL
                ELSE NULL
            END
        FROM profiles p
        WHERE p.role = 'student' 
        AND p.school_id = NEW.school_id
        ON CONFLICT (student_id, quest_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE OR REPLACE TRIGGER trigger_update_badge_awarded_count_insert
    AFTER INSERT ON student_badge_achievements
    FOR EACH ROW EXECUTE FUNCTION update_badge_awarded_count();

CREATE OR REPLACE TRIGGER trigger_update_badge_awarded_count_delete
    AFTER DELETE ON student_badge_achievements
    FOR EACH ROW EXECUTE FUNCTION update_badge_awarded_count();

CREATE OR REPLACE TRIGGER trigger_auto_assign_quest
    AFTER INSERT ON custom_quests
    FOR EACH ROW EXECUTE FUNCTION auto_assign_quest_to_students();

-- Sample Quest Templates
INSERT INTO quest_templates (title, description, category, difficulty, suggested_xp_reward, suggested_gem_reward, requirements_template, suggested_time_limit, created_by, is_public)
SELECT 
    'Reading Champion',
    'Read and summarize books to become a reading champion!',
    'academic',
    'medium',
    100,
    20,
    ARRAY['Read 3 books', 'Write a summary for each book', 'Share favorite quotes'],
    14,
    p.id,
    true
FROM profiles p 
WHERE p.role = 'teacher' 
LIMIT 1;

INSERT INTO quest_templates (title, description, category, difficulty, suggested_xp_reward, suggested_gem_reward, requirements_template, suggested_time_limit, created_by, is_public)
SELECT 
    'Kindness Warrior',
    'Spread kindness throughout the school community!',
    'behavior',
    'easy',
    75,
    15,
    ARRAY['Perform 5 acts of kindness', 'Help a classmate with homework', 'Write thank you notes to school staff'],
    7,
    p.id,
    true
FROM profiles p 
WHERE p.role = 'teacher' 
LIMIT 1;

-- Sample Badge Templates
INSERT INTO badge_templates (name, description, icon, color, criteria_template, rarity, created_by, is_public)
SELECT 
    'Math Wizard',
    'Awarded for exceptional mathematical problem-solving skills',
    '🧙‍♂️',
    '#8B5CF6',
    ARRAY['Score 90% or higher on 3 consecutive math tests', 'Help classmates with math problems', 'Complete bonus math challenges'],
    'rare',
    p.id,
    true
FROM profiles p 
WHERE p.role = 'teacher' 
LIMIT 1;

INSERT INTO badge_templates (name, description, icon, color, criteria_template, rarity, created_by, is_public)
SELECT 
    'Team Player',
    'Recognizes outstanding collaboration and teamwork',
    '🤝',
    '#10B981',
    ARRAY['Successfully complete 3 group projects', 'Demonstrate leadership in team activities', 'Help team members achieve their goals'],
    'common',
    p.id,
    true
FROM profiles p 
WHERE p.role = 'teacher' 
LIMIT 1;
