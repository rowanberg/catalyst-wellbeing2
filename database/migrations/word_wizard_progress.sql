-- Create table for Word Wizard Academy progress tracking
CREATE TABLE IF NOT EXISTS word_wizard_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chapter_id INTEGER NOT NULL,
    spells_completed INTEGER NOT NULL DEFAULT 0,
    total_spells INTEGER NOT NULL,
    xp_earned INTEGER NOT NULL DEFAULT 0,
    gems_earned INTEGER NOT NULL DEFAULT 0,
    time_spent INTEGER NOT NULL DEFAULT 0, -- in seconds
    difficulty VARCHAR(20) DEFAULT 'medium',
    category VARCHAR(50) DEFAULT 'general',
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one record per user per chapter
    UNIQUE(user_id, chapter_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_word_wizard_progress_user_id ON word_wizard_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_word_wizard_progress_chapter_id ON word_wizard_progress(chapter_id);
CREATE INDEX IF NOT EXISTS idx_word_wizard_progress_completed ON word_wizard_progress(is_completed);

-- Enable RLS (Row Level Security)
ALTER TABLE word_wizard_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own progress" ON word_wizard_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON word_wizard_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON word_wizard_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Create function to add student points
CREATE OR REPLACE FUNCTION add_student_points(
    student_id UUID,
    points_to_add INTEGER,
    source TEXT DEFAULT 'game',
    description TEXT DEFAULT ''
)
RETURNS VOID AS $$
BEGIN
    -- Update the student's points in profiles table
    UPDATE profiles 
    SET points = COALESCE(points, 0) + points_to_add,
        updated_at = NOW()
    WHERE id = student_id;
    
    -- Insert into points_history table if it exists
    INSERT INTO points_history (
        user_id, 
        points_earned, 
        source, 
        description, 
        created_at
    ) VALUES (
        student_id, 
        points_to_add, 
        source, 
        description, 
        NOW()
    ) ON CONFLICT DO NOTHING;
    
EXCEPTION
    WHEN OTHERS THEN
        -- If points_history table doesn't exist, just update profiles
        UPDATE profiles 
        SET points = COALESCE(points, 0) + points_to_add,
            updated_at = NOW()
        WHERE id = student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create points_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS points_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    points_earned INTEGER NOT NULL,
    source VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for points_history table
CREATE INDEX IF NOT EXISTS idx_points_history_user_id ON points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_created_at ON points_history(created_at);

-- Enable RLS for points_history
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for points_history
CREATE POLICY "Users can view their own points history" ON points_history
    FOR SELECT USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON word_wizard_progress TO authenticated;
GRANT ALL ON points_history TO authenticated;
GRANT EXECUTE ON FUNCTION add_student_points TO authenticated;
