-- Create quest_badges table for the gamification system
-- This table stores badges that can be awarded to students

CREATE TABLE IF NOT EXISTS quest_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(10) DEFAULT '🏆',
    color VARCHAR(7) DEFAULT '#3B82F6',
    criteria JSONB DEFAULT '[]'::jsonb,
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    category VARCHAR(50) DEFAULT 'achievement' CHECK (category IN ('achievement', 'academic', 'behavior', 'participation', 'creativity', 'leadership', 'teamwork', 'improvement')),
    points INTEGER DEFAULT 10 CHECK (points > 0),
    prerequisites JSONB DEFAULT '[]'::jsonb,
    is_stackable BOOLEAN DEFAULT false,
    max_stack INTEGER DEFAULT 1,
    valid_until TIMESTAMP WITH TIME ZONE,
    auto_award BOOLEAN DEFAULT false,
    trigger_conditions JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quest_badges_school_id ON quest_badges(school_id);
CREATE INDEX IF NOT EXISTS idx_quest_badges_teacher_id ON quest_badges(teacher_id);
CREATE INDEX IF NOT EXISTS idx_quest_badges_category ON quest_badges(category);
CREATE INDEX IF NOT EXISTS idx_quest_badges_rarity ON quest_badges(rarity);
CREATE INDEX IF NOT EXISTS idx_quest_badges_active ON quest_badges(is_active);

-- Enable Row Level Security
ALTER TABLE quest_badges ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Teachers can view badges from their school" ON quest_badges
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('teacher', 'admin')
        )
    );

CREATE POLICY "Teachers can create badges for their school" ON quest_badges
    FOR INSERT WITH CHECK (
        school_id IN (
            SELECT school_id FROM profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('teacher', 'admin')
        )
    );

CREATE POLICY "Teachers can update their own badges" ON quest_badges
    FOR UPDATE USING (
        teacher_id = auth.uid() OR
        school_id IN (
            SELECT school_id FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Teachers can delete their own badges" ON quest_badges
    FOR DELETE USING (
        teacher_id = auth.uid() OR
        school_id IN (
            SELECT school_id FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_quest_badges_updated_at 
    BEFORE UPDATE ON quest_badges 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample badges for demonstration (optional)
-- These will only be inserted if the table is empty
INSERT INTO quest_badges (school_id, teacher_id, name, description, icon, color, category, rarity, points)
SELECT 
    s.id as school_id,
    p.user_id as teacher_id,
    'First Day Champion' as name,
    'Awarded for successfully completing your first day of school!' as description,
    '🌟' as icon,
    '#FFD700' as color,
    'achievement' as category,
    'common' as rarity,
    10 as points
FROM schools s
CROSS JOIN profiles p
WHERE p.role = 'teacher' 
AND p.school_id = s.id
AND NOT EXISTS (SELECT 1 FROM quest_badges)
LIMIT 1;

COMMENT ON TABLE quest_badges IS 'Stores badges that can be awarded to students as part of the gamification system';
COMMENT ON COLUMN quest_badges.criteria IS 'JSON array of criteria that must be met to earn this badge';
COMMENT ON COLUMN quest_badges.prerequisites IS 'JSON array of badge IDs that must be earned before this badge';
COMMENT ON COLUMN quest_badges.trigger_conditions IS 'JSON object defining automatic award conditions';
