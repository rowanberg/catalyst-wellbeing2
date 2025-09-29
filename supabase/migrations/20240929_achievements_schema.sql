-- Achievement System Database Schema
-- This creates tables for student achievements, milestones, and progress tracking

-- Achievement Templates Table (defines all possible achievements)
CREATE TABLE IF NOT EXISTS achievement_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('academic', 'social', 'wellness', 'creativity', 'leadership', 'special')),
    type VARCHAR(50) NOT NULL CHECK (type IN ('badge', 'trophy', 'medal', 'certificate')),
    rarity VARCHAR(50) NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    icon VARCHAR(100) NOT NULL,
    color VARCHAR(50) NOT NULL,
    requirements JSONB NOT NULL, -- Array of requirements to unlock
    rewards JSONB NOT NULL, -- XP, gems, titles, etc.
    max_progress INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student Achievements Table (tracks which achievements students have unlocked)
CREATE TABLE IF NOT EXISTS student_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_template_id UUID NOT NULL REFERENCES achievement_templates(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    is_unlocked BOOLEAN DEFAULT false,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    is_new BOOLEAN DEFAULT true, -- Mark as new until student views it
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, achievement_template_id)
);

-- Milestone Templates Table (defines milestone goals)
CREATE TABLE IF NOT EXISTS milestone_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    icon VARCHAR(100) NOT NULL,
    color VARCHAR(50) NOT NULL,
    target_value INTEGER NOT NULL,
    data_source VARCHAR(100) NOT NULL, -- e.g., 'quests_completed', 'xp_earned', 'streak_days'
    rewards JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student Milestones Table (tracks student progress on milestones)
CREATE TABLE IF NOT EXISTS student_milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    milestone_template_id UUID NOT NULL REFERENCES milestone_templates(id) ON DELETE CASCADE,
    current_value INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, milestone_template_id)
);

-- Achievement Stats Table (aggregated stats for leaderboards)
CREATE TABLE IF NOT EXISTS student_achievement_stats (
    student_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_achievements INTEGER DEFAULT 0,
    unlocked_achievements INTEGER DEFAULT 0,
    total_xp_from_achievements INTEGER DEFAULT 0,
    total_gems_from_achievements INTEGER DEFAULT 0,
    school_rank INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_achievements_student_id ON student_achievements(student_id);
CREATE INDEX IF NOT EXISTS idx_student_achievements_unlocked ON student_achievements(student_id, is_unlocked);
CREATE INDEX IF NOT EXISTS idx_student_milestones_student_id ON student_milestones(student_id);
CREATE INDEX IF NOT EXISTS idx_achievement_templates_category ON achievement_templates(category);
CREATE INDEX IF NOT EXISTS idx_achievement_templates_active ON achievement_templates(is_active);

-- Row Level Security (RLS) Policies
ALTER TABLE achievement_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_achievement_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievement_templates (readable by all authenticated users)
CREATE POLICY "Achievement templates are viewable by authenticated users" ON achievement_templates
    FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for student_achievements (students can only see their own)
CREATE POLICY "Students can view their own achievements" ON student_achievements
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can update their own achievements" ON student_achievements
    FOR UPDATE USING (auth.uid() = student_id);

-- RLS Policies for milestone_templates (readable by all authenticated users)
CREATE POLICY "Milestone templates are viewable by authenticated users" ON milestone_templates
    FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for student_milestones (students can only see their own)
CREATE POLICY "Students can view their own milestones" ON student_milestones
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can update their own milestones" ON student_milestones
    FOR UPDATE USING (auth.uid() = student_id);

-- RLS Policies for student_achievement_stats (students can only see their own)
CREATE POLICY "Students can view their own achievement stats" ON student_achievement_stats
    FOR SELECT USING (auth.uid() = student_id);

-- Functions to update achievement progress
CREATE OR REPLACE FUNCTION update_achievement_progress(
    p_student_id UUID,
    p_achievement_template_id UUID,
    p_progress_increment INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_progress INTEGER;
    v_max_progress INTEGER;
    v_is_unlocked BOOLEAN;
BEGIN
    -- Get current progress and max progress
    SELECT sa.progress, at.max_progress, sa.is_unlocked
    INTO v_current_progress, v_max_progress, v_is_unlocked
    FROM student_achievements sa
    JOIN achievement_templates at ON sa.achievement_template_id = at.id
    WHERE sa.student_id = p_student_id AND sa.achievement_template_id = p_achievement_template_id;
    
    -- If record doesn't exist, create it
    IF NOT FOUND THEN
        INSERT INTO student_achievements (student_id, achievement_template_id, progress)
        VALUES (p_student_id, p_achievement_template_id, p_progress_increment);
        
        SELECT max_progress INTO v_max_progress
        FROM achievement_templates WHERE id = p_achievement_template_id;
        
        v_current_progress := p_progress_increment;
        v_is_unlocked := FALSE;
    ELSE
        -- Update progress
        v_current_progress := v_current_progress + p_progress_increment;
        
        UPDATE student_achievements 
        SET progress = v_current_progress, updated_at = NOW()
        WHERE student_id = p_student_id AND achievement_template_id = p_achievement_template_id;
    END IF;
    
    -- Check if achievement should be unlocked
    IF NOT v_is_unlocked AND v_current_progress >= v_max_progress THEN
        UPDATE student_achievements 
        SET is_unlocked = TRUE, unlocked_at = NOW(), is_new = TRUE, updated_at = NOW()
        WHERE student_id = p_student_id AND achievement_template_id = p_achievement_template_id;
        
        -- Update achievement stats
        PERFORM refresh_achievement_stats(p_student_id);
        
        RETURN TRUE; -- Achievement unlocked
    END IF;
    
    RETURN FALSE; -- Achievement not unlocked
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refresh achievement stats
CREATE OR REPLACE FUNCTION refresh_achievement_stats(p_student_id UUID)
RETURNS VOID AS $$
DECLARE
    v_total_achievements INTEGER;
    v_unlocked_achievements INTEGER;
    v_total_xp INTEGER;
    v_total_gems INTEGER;
BEGIN
    -- Calculate stats
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE sa.is_unlocked = TRUE),
        COALESCE(SUM((at.rewards->>'xp')::INTEGER) FILTER (WHERE sa.is_unlocked = TRUE), 0),
        COALESCE(SUM((at.rewards->>'gems')::INTEGER) FILTER (WHERE sa.is_unlocked = TRUE), 0)
    INTO v_total_achievements, v_unlocked_achievements, v_total_xp, v_total_gems
    FROM student_achievements sa
    JOIN achievement_templates at ON sa.achievement_template_id = at.id
    WHERE sa.student_id = p_student_id;
    
    -- Upsert stats
    INSERT INTO student_achievement_stats (
        student_id, total_achievements, unlocked_achievements, 
        total_xp_from_achievements, total_gems_from_achievements, updated_at
    )
    VALUES (p_student_id, v_total_achievements, v_unlocked_achievements, v_total_xp, v_total_gems, NOW())
    ON CONFLICT (student_id) DO UPDATE SET
        total_achievements = EXCLUDED.total_achievements,
        unlocked_achievements = EXCLUDED.unlocked_achievements,
        total_xp_from_achievements = EXCLUDED.total_xp_from_achievements,
        total_gems_from_achievements = EXCLUDED.total_gems_from_achievements,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update milestone progress
CREATE OR REPLACE FUNCTION update_milestone_progress(
    p_student_id UUID,
    p_data_source VARCHAR(100),
    p_new_value INTEGER
)
RETURNS VOID AS $$
BEGIN
    -- Update all milestones for this data source
    UPDATE student_milestones sm
    SET 
        current_value = p_new_value,
        is_completed = CASE 
            WHEN p_new_value >= mt.target_value THEN TRUE 
            ELSE is_completed 
        END,
        completed_at = CASE 
            WHEN p_new_value >= mt.target_value AND NOT is_completed THEN NOW()
            ELSE completed_at
        END,
        updated_at = NOW()
    FROM milestone_templates mt
    WHERE sm.milestone_template_id = mt.id 
        AND sm.student_id = p_student_id 
        AND mt.data_source = p_data_source;
        
    -- Insert milestones that don't exist yet
    INSERT INTO student_milestones (student_id, milestone_template_id, current_value, is_completed, completed_at)
    SELECT 
        p_student_id,
        mt.id,
        p_new_value,
        p_new_value >= mt.target_value,
        CASE WHEN p_new_value >= mt.target_value THEN NOW() ELSE NULL END
    FROM milestone_templates mt
    WHERE mt.data_source = p_data_source
        AND mt.is_active = TRUE
        AND NOT EXISTS (
            SELECT 1 FROM student_milestones sm 
            WHERE sm.student_id = p_student_id AND sm.milestone_template_id = mt.id
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
