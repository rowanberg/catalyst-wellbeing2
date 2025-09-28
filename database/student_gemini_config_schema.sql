-- Student Gemini AI Configuration Table
-- This table stores encrypted API keys and model preferences for students

CREATE TABLE IF NOT EXISTS student_gemini_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    encrypted_api_key TEXT NOT NULL,
    selected_model VARCHAR(50) NOT NULL DEFAULT 'gemini-1.5-flash',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one config per user
    UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_gemini_config_user_id ON student_gemini_config(user_id);
CREATE INDEX IF NOT EXISTS idx_student_gemini_config_updated_at ON student_gemini_config(updated_at);

-- Row Level Security (RLS) Policies
ALTER TABLE student_gemini_config ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own Gemini configuration
CREATE POLICY "Users can manage their own Gemini config" ON student_gemini_config
    FOR ALL USING (auth.uid() = user_id);

-- Policy: Users can insert their own Gemini configuration
CREATE POLICY "Users can insert their own Gemini config" ON student_gemini_config
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own Gemini configuration
CREATE POLICY "Users can update their own Gemini config" ON student_gemini_config
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own Gemini configuration
CREATE POLICY "Users can delete their own Gemini config" ON student_gemini_config
    FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_student_gemini_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on row updates
CREATE TRIGGER update_student_gemini_config_updated_at_trigger
    BEFORE UPDATE ON student_gemini_config
    FOR EACH ROW
    EXECUTE FUNCTION update_student_gemini_config_updated_at();

-- Add comments for documentation
COMMENT ON TABLE student_gemini_config IS 'Stores encrypted Gemini AI API keys and model preferences for students';
COMMENT ON COLUMN student_gemini_config.user_id IS 'Reference to the student user';
COMMENT ON COLUMN student_gemini_config.encrypted_api_key IS 'Encrypted Gemini API key for secure storage';
COMMENT ON COLUMN student_gemini_config.selected_model IS 'Preferred Gemini model (e.g., gemini-1.5-flash, gemini-1.5-pro)';
COMMENT ON COLUMN student_gemini_config.created_at IS 'Timestamp when the configuration was created';
COMMENT ON COLUMN student_gemini_config.updated_at IS 'Timestamp when the configuration was last updated';
