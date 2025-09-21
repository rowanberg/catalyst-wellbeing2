-- Add affirmation_sessions table for tracking daily affirmation practice
CREATE TABLE IF NOT EXISTS affirmation_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    sessions_completed INTEGER DEFAULT 0,
    last_session_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_affirmation_sessions_user_id ON affirmation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_affirmation_sessions_date ON affirmation_sessions(date);

-- Enable RLS
ALTER TABLE affirmation_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy for affirmation_sessions
DROP POLICY IF EXISTS "Users can manage own affirmation sessions" ON affirmation_sessions;
CREATE POLICY "Users can manage own affirmation sessions" ON affirmation_sessions FOR ALL USING (auth.uid() = user_id);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_affirmation_sessions_updated_at ON affirmation_sessions;
CREATE TRIGGER update_affirmation_sessions_updated_at 
    BEFORE UPDATE ON affirmation_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
