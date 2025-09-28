-- Math Battle Arena Progress Tracking Schema
-- This schema tracks student progress through Math Battle Arena levels

-- Create math_battle_progress table
CREATE TABLE IF NOT EXISTS math_battle_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    level_id INTEGER NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    stars INTEGER DEFAULT 0 CHECK (stars >= 0 AND stars <= 3),
    xp_earned INTEGER DEFAULT 0,
    gems_earned INTEGER DEFAULT 0,
    best_time INTEGER, -- in seconds
    attempts INTEGER DEFAULT 1,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one record per student per level
    UNIQUE(student_id, level_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_math_battle_progress_student_id ON math_battle_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_math_battle_progress_level_id ON math_battle_progress(level_id);
CREATE INDEX IF NOT EXISTS idx_math_battle_progress_completed ON math_battle_progress(completed);

-- Add columns to profiles table for game stats (if they don't exist)
DO $$ 
BEGIN
    -- Add total_xp column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_xp') THEN
        ALTER TABLE profiles ADD COLUMN total_xp INTEGER DEFAULT 0;
    END IF;
    
    -- Add total_gems column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_gems') THEN
        ALTER TABLE profiles ADD COLUMN total_gems INTEGER DEFAULT 0;
    END IF;
    
    -- Add math_battle_level column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'math_battle_level') THEN
        ALTER TABLE profiles ADD COLUMN math_battle_level INTEGER DEFAULT 1;
    END IF;
END $$;

-- Row Level Security (RLS) Policies
ALTER TABLE math_battle_progress ENABLE ROW LEVEL SECURITY;

-- Students can only access their own progress
CREATE POLICY "Students can view their own math battle progress" ON math_battle_progress
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own math battle progress" ON math_battle_progress
    FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own math battle progress" ON math_battle_progress
    FOR UPDATE USING (auth.uid() = student_id);

-- Teachers can view progress of students in their classes
CREATE POLICY "Teachers can view student math battle progress" ON math_battle_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles teacher_profile
            JOIN teacher_class_assignments tca ON teacher_profile.id = tca.teacher_id
            JOIN student_class_assignments sca ON tca.class_id = sca.class_id
            WHERE teacher_profile.id = auth.uid()
            AND teacher_profile.role = 'teacher'
            AND sca.student_id = math_battle_progress.student_id
        )
    );

-- Admins can view all progress in their school
CREATE POLICY "Admins can view all math battle progress in their school" ON math_battle_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles admin_profile
            JOIN profiles student_profile ON student_profile.id = math_battle_progress.student_id
            WHERE admin_profile.id = auth.uid()
            AND admin_profile.role = 'admin'
            AND admin_profile.school_id = student_profile.school_id
        )
    );

-- Function to get student's math battle statistics
CREATE OR REPLACE FUNCTION get_math_battle_stats(student_uuid UUID)
RETURNS TABLE (
    total_levels_completed INTEGER,
    total_stars INTEGER,
    total_xp_earned INTEGER,
    total_gems_earned INTEGER,
    current_level INTEGER,
    completion_percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(CASE WHEN completed THEN 1 END)::INTEGER as total_levels_completed,
        COALESCE(SUM(stars), 0)::INTEGER as total_stars,
        COALESCE(SUM(xp_earned), 0)::INTEGER as total_xp_earned,
        COALESCE(SUM(gems_earned), 0)::INTEGER as total_gems_earned,
        COALESCE(MAX(CASE WHEN completed THEN level_id END), 0)::INTEGER + 1 as current_level,
        ROUND(
            (COUNT(CASE WHEN completed THEN 1 END)::DECIMAL / 5) * 100, 2
        ) as completion_percentage
    FROM math_battle_progress 
    WHERE student_id = student_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unlock next level after completion
CREATE OR REPLACE FUNCTION unlock_next_math_battle_level()
RETURNS TRIGGER AS $$
BEGIN
    -- If a level is completed, ensure the next level data exists
    IF NEW.completed = TRUE AND (OLD.completed IS NULL OR OLD.completed = FALSE) THEN
        -- Update the student's current level in profiles
        UPDATE profiles 
        SET math_battle_level = GREATEST(math_battle_level, NEW.level_id + 1)
        WHERE id = NEW.student_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for level unlocking
DROP TRIGGER IF EXISTS trigger_unlock_next_math_battle_level ON math_battle_progress;
CREATE TRIGGER trigger_unlock_next_math_battle_level
    AFTER INSERT OR UPDATE ON math_battle_progress
    FOR EACH ROW
    EXECUTE FUNCTION unlock_next_math_battle_level();

-- Insert sample data for testing (optional)
-- This can be removed in production
INSERT INTO math_battle_progress (student_id, level_id, completed, stars, xp_earned, gems_earned, completed_at)
SELECT 
    p.id,
    1,
    true,
    3,
    100,
    20,
    NOW() - INTERVAL '1 day'
FROM profiles p 
WHERE p.role = 'student' 
AND NOT EXISTS (
    SELECT 1 FROM math_battle_progress mbp 
    WHERE mbp.student_id = p.id AND mbp.level_id = 1
)
LIMIT 5
ON CONFLICT (student_id, level_id) DO NOTHING;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON math_battle_progress TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION get_math_battle_stats(UUID) TO authenticated;
