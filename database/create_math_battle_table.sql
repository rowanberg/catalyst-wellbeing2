-- Create math_battle_progress table for Math Battle Arena game
-- Run this in Supabase SQL Editor if the table doesn't exist

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

-- Enable Row Level Security
ALTER TABLE math_battle_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (with IF NOT EXISTS equivalent)
DO $$ 
BEGIN
    -- Check and create SELECT policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'math_battle_progress' 
        AND policyname = 'Students can view their own progress'
    ) THEN
        CREATE POLICY "Students can view their own progress" ON math_battle_progress
            FOR SELECT USING (auth.uid() = student_id);
    END IF;
    
    -- Check and create INSERT policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'math_battle_progress' 
        AND policyname = 'Students can insert their own progress'
    ) THEN
        CREATE POLICY "Students can insert their own progress" ON math_battle_progress
            FOR INSERT WITH CHECK (auth.uid() = student_id);
    END IF;
    
    -- Check and create UPDATE policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'math_battle_progress' 
        AND policyname = 'Students can update their own progress'
    ) THEN
        CREATE POLICY "Students can update their own progress" ON math_battle_progress
            FOR UPDATE USING (auth.uid() = student_id);
    END IF;
END $$;

-- Add columns to profiles table for total game stats (if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_xp') THEN
        ALTER TABLE profiles ADD COLUMN total_xp INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_gems') THEN
        ALTER TABLE profiles ADD COLUMN total_gems INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create indexes on profiles for game stats
CREATE INDEX IF NOT EXISTS idx_profiles_total_xp ON profiles(total_xp);
CREATE INDEX IF NOT EXISTS idx_profiles_total_gems ON profiles(total_gems);
