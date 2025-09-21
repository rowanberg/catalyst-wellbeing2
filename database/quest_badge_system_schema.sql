-- Quest and Badge Management System Schema
-- This file creates the complete database structure for quest and badge management

-- Enable RLS
ALTER DATABASE postgres SET row_security = on;

-- Create quests table
CREATE TABLE IF NOT EXISTS quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('academic', 'behavior', 'social', 'creative', 'wellness', 'leadership')),
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
    xp_reward INTEGER NOT NULL DEFAULT 10 CHECK (xp_reward > 0),
    gem_reward INTEGER NOT NULL DEFAULT 5 CHECK (gem_reward > 0),
    requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
    time_limit INTEGER, -- in days
    is_active BOOLEAN NOT NULL DEFAULT true,
    tags JSONB DEFAULT '[]'::jsonb,
    prerequisites JSONB DEFAULT '[]'::jsonb, -- array of quest IDs
    auto_assign BOOLEAN NOT NULL DEFAULT false,
    target_students JSONB DEFAULT '[]'::jsonb, -- array of student IDs
    due_date TIMESTAMP WITH TIME ZONE,
    repeat_type VARCHAR(20) DEFAULT 'none' CHECK (repeat_type IN ('none', 'daily', 'weekly', 'monthly')),
    points JSONB DEFAULT '{"creativity": 0, "collaboration": 0, "critical_thinking": 0, "communication": 0}'::jsonb,
    is_template BOOLEAN NOT NULL DEFAULT false,
    template_category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quest_badges table
CREATE TABLE IF NOT EXISTS quest_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(10) NOT NULL DEFAULT '🏆',
    color VARCHAR(7) NOT NULL DEFAULT '#3B82F6', -- hex color
    criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
    rarity VARCHAR(20) NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary', 'mythic')),
    category VARCHAR(50) NOT NULL DEFAULT 'achievement' CHECK (category IN ('achievement', 'milestone', 'skill', 'behavior', 'special')),
    points INTEGER NOT NULL DEFAULT 10 CHECK (points > 0),
    prerequisites JSONB DEFAULT '[]'::jsonb, -- array of badge/quest IDs
    is_stackable BOOLEAN NOT NULL DEFAULT false,
    max_stack INTEGER DEFAULT 1,
    valid_until TIMESTAMP WITH TIME ZONE,
    auto_award BOOLEAN NOT NULL DEFAULT false,
    trigger_conditions JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quest_attempts table for tracking student progress
CREATE TABLE IF NOT EXISTS quest_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed', 'abandoned')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    time_spent INTEGER DEFAULT 0, -- in minutes
    progress JSONB DEFAULT '{}'::jsonb, -- track requirement completion
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(quest_id, student_id)
);

-- Create badge_awards table for tracking badge earnings
CREATE TABLE IF NOT EXISTS badge_awards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    badge_id UUID NOT NULL REFERENCES quest_badges(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    awarded_by UUID REFERENCES profiles(id), -- teacher who awarded it
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stack_count INTEGER DEFAULT 1,
    reason TEXT,
    auto_awarded BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quest_templates table
CREATE TABLE IF NOT EXISTS quest_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    estimated_duration VARCHAR(50),
    target_age VARCHAR(50),
    learning_objectives JSONB DEFAULT '[]'::jsonb,
    template_data JSONB NOT NULL, -- contains quests and badges data
    is_public BOOLEAN DEFAULT false,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quests_school_id ON quests(school_id);
CREATE INDEX IF NOT EXISTS idx_quests_teacher_id ON quests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_quests_category ON quests(category);
CREATE INDEX IF NOT EXISTS idx_quests_difficulty ON quests(difficulty);
CREATE INDEX IF NOT EXISTS idx_quests_active ON quests(is_active);
CREATE INDEX IF NOT EXISTS idx_quests_created_at ON quests(created_at);

CREATE INDEX IF NOT EXISTS idx_quest_badges_school_id ON quest_badges(school_id);
CREATE INDEX IF NOT EXISTS idx_quest_badges_teacher_id ON quest_badges(teacher_id);
CREATE INDEX IF NOT EXISTS idx_quest_badges_category ON quest_badges(category);
CREATE INDEX IF NOT EXISTS idx_quest_badges_rarity ON quest_badges(rarity);

CREATE INDEX IF NOT EXISTS idx_quest_attempts_quest_id ON quest_attempts(quest_id);
CREATE INDEX IF NOT EXISTS idx_quest_attempts_student_id ON quest_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_quest_attempts_status ON quest_attempts(status);

CREATE INDEX IF NOT EXISTS idx_badge_awards_badge_id ON badge_awards(badge_id);
CREATE INDEX IF NOT EXISTS idx_badge_awards_student_id ON badge_awards(student_id);
CREATE INDEX IF NOT EXISTS idx_badge_awards_awarded_at ON badge_awards(awarded_at);

-- Create RLS policies
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quests
CREATE POLICY "Teachers can manage their school's quests" ON quests
    FOR ALL USING (
        school_id IN (
            SELECT school_id FROM profiles 
            WHERE id = auth.uid() AND role IN ('teacher', 'admin')
        )
    );

CREATE POLICY "Students can view active quests from their school" ON quests
    FOR SELECT USING (
        is_active = true AND school_id IN (
            SELECT school_id FROM profiles 
            WHERE id = auth.uid() AND role = 'student'
        )
    );

-- RLS Policies for quest_badges
CREATE POLICY "Teachers can manage their school's badges" ON quest_badges
    FOR ALL USING (
        school_id IN (
            SELECT school_id FROM profiles 
            WHERE id = auth.uid() AND role IN ('teacher', 'admin')
        )
    );

CREATE POLICY "Students can view active badges from their school" ON quest_badges
    FOR SELECT USING (
        is_active = true AND school_id IN (
            SELECT school_id FROM profiles 
            WHERE id = auth.uid() AND role = 'student'
        )
    );

-- RLS Policies for quest_attempts
CREATE POLICY "Students can manage their own quest attempts" ON quest_attempts
    FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Teachers can view quest attempts from their school" ON quest_attempts
    FOR SELECT USING (
        quest_id IN (
            SELECT id FROM quests WHERE school_id IN (
                SELECT school_id FROM profiles 
                WHERE id = auth.uid() AND role IN ('teacher', 'admin')
            )
        )
    );

-- RLS Policies for badge_awards
CREATE POLICY "Students can view their own badge awards" ON badge_awards
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Teachers can manage badge awards for their school" ON badge_awards
    FOR ALL USING (
        badge_id IN (
            SELECT id FROM quest_badges WHERE school_id IN (
                SELECT school_id FROM profiles 
                WHERE id = auth.uid() AND role IN ('teacher', 'admin')
            )
        )
    );

-- RLS Policies for quest_templates
CREATE POLICY "Everyone can view public templates" ON quest_templates
    FOR SELECT USING (is_public = true);

CREATE POLICY "Teachers can manage their own templates" ON quest_templates
    FOR ALL USING (created_by = auth.uid());

-- Create functions for analytics
CREATE OR REPLACE FUNCTION get_quest_analytics(p_school_id UUID, p_teacher_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    WITH quest_stats AS (
        SELECT 
            COUNT(*) as total_quests,
            COUNT(*) FILTER (WHERE is_active = true) as active_quests,
            AVG(CASE 
                WHEN total_attempts > 0 THEN (completed_attempts::float / total_attempts * 100)
                ELSE 0 
            END) as completion_rate
        FROM (
            SELECT 
                q.id,
                q.is_active,
                COUNT(qa.id) as total_attempts,
                COUNT(qa.id) FILTER (WHERE qa.status = 'completed') as completed_attempts
            FROM quests q
            LEFT JOIN quest_attempts qa ON q.id = qa.quest_id
            WHERE q.school_id = p_school_id 
                AND (p_teacher_id IS NULL OR q.teacher_id = p_teacher_id)
            GROUP BY q.id, q.is_active
        ) quest_data
    ),
    recent_completions AS (
        SELECT 
            qa.completed_at,
            qa.time_spent,
            q.title as quest_title,
            p.full_name as student_name
        FROM quest_attempts qa
        JOIN quests q ON qa.quest_id = q.id
        JOIN profiles p ON qa.student_id = p.id
        WHERE qa.status = 'completed' 
            AND q.school_id = p_school_id
            AND (p_teacher_id IS NULL OR q.teacher_id = p_teacher_id)
            AND qa.completed_at >= NOW() - INTERVAL '30 days'
        ORDER BY qa.completed_at DESC
        LIMIT 10
    ),
    category_breakdown AS (
        SELECT 
            q.category,
            COUNT(*) as count
        FROM quests q
        WHERE q.school_id = p_school_id 
            AND (p_teacher_id IS NULL OR q.teacher_id = p_teacher_id)
        GROUP BY q.category
    )
    SELECT json_build_object(
        'totalQuests', COALESCE(qs.total_quests, 0),
        'activeQuests', COALESCE(qs.active_quests, 0),
        'completionRate', ROUND(COALESCE(qs.completion_rate, 0)::numeric, 1),
        'averageEngagement', 75, -- placeholder
        'recentCompletions', COALESCE(
            (SELECT json_agg(
                json_build_object(
                    'questTitle', quest_title,
                    'studentName', student_name,
                    'completedAt', completed_at,
                    'timeSpent', time_spent
                )
            ) FROM recent_completions), '[]'::json
        ),
        'categoryBreakdown', COALESCE(
            (SELECT json_object_agg(category, count) FROM category_breakdown), '{}'::json
        )
    ) INTO result
    FROM quest_stats qs;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update quest analytics
CREATE OR REPLACE FUNCTION update_quest_attempt_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update quest completion stats when attempt status changes
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        -- Could add more complex analytics updates here
        NEW.updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_quests_updated_at
    BEFORE UPDATE ON quests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quest_badges_updated_at
    BEFORE UPDATE ON quest_badges
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quest_attempts_updated_at
    BEFORE UPDATE ON quest_attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quest_templates_updated_at
    BEFORE UPDATE ON quest_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
