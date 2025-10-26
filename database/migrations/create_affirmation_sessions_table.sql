-- Create affirmation_sessions table to track student daily affirmation completions
-- This table records when students complete affirmation sessions and how many per day

CREATE TABLE IF NOT EXISTS public.affirmation_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    sessions_completed INTEGER DEFAULT 0 NOT NULL,
    last_session_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one record per user per day
    CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_affirmation_sessions_user_id ON public.affirmation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_affirmation_sessions_date ON public.affirmation_sessions(date);
CREATE INDEX IF NOT EXISTS idx_affirmation_sessions_user_date ON public.affirmation_sessions(user_id, date);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_affirmation_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_affirmation_sessions_updated_at
    BEFORE UPDATE ON public.affirmation_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_affirmation_sessions_updated_at();

-- Enable Row Level Security
ALTER TABLE public.affirmation_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Students can only view their own affirmation sessions
CREATE POLICY "Students can view own affirmation sessions"
    ON public.affirmation_sessions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Students can insert their own affirmation sessions
CREATE POLICY "Students can insert own affirmation sessions"
    ON public.affirmation_sessions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Students can update their own affirmation sessions
CREATE POLICY "Students can update own affirmation sessions"
    ON public.affirmation_sessions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Teachers can view all students' affirmation sessions in their school
CREATE POLICY "Teachers can view student affirmation sessions"
    ON public.affirmation_sessions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'teacher'
        )
    );

-- Admins and Super Admins can view all affirmation sessions
CREATE POLICY "Admins can view all affirmation sessions"
    ON public.affirmation_sessions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.affirmation_sessions TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Add helpful comment
COMMENT ON TABLE public.affirmation_sessions IS 'Tracks daily affirmation session completions for students, including session count and rewards';
COMMENT ON COLUMN public.affirmation_sessions.sessions_completed IS 'Number of affirmation sessions completed on this date';
COMMENT ON COLUMN public.affirmation_sessions.last_session_at IS 'Timestamp of the most recent session completion';
