-- Add breathing_sessions table for tracking mindfulness sessions
CREATE TABLE IF NOT EXISTS breathing_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    cycles_completed INTEGER NOT NULL,
    session_type VARCHAR(20) DEFAULT '4-4-6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE breathing_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own breathing sessions
CREATE POLICY "Users can view own breathing sessions" ON breathing_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own breathing sessions
CREATE POLICY "Users can insert own breathing sessions" ON breathing_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS breathing_sessions_user_id_idx ON breathing_sessions(user_id);
CREATE INDEX IF NOT EXISTS breathing_sessions_created_at_idx ON breathing_sessions(created_at);
