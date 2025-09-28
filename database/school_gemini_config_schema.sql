-- School-level Gemini AI Configuration
-- This table stores Gemini API keys at the school level so all admins in a school can use the same configuration

CREATE TABLE IF NOT EXISTS school_gemini_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL, -- Store API key in plain text (as requested)
  selected_model TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
  is_active BOOLEAN DEFAULT true,
  configured_by UUID REFERENCES profiles(user_id), -- Admin who configured it
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one config per school
  UNIQUE(school_id)
);

-- Row Level Security (RLS) Policies
ALTER TABLE school_gemini_config ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can only access their own school's Gemini config
CREATE POLICY "Admins can manage their school's Gemini config" ON school_gemini_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin' 
      AND profiles.school_id = school_gemini_config.school_id
    )
  );

-- Policy: Service role can access all configs (for system operations)
CREATE POLICY "Service role can access all school Gemini configs" ON school_gemini_config
  FOR ALL USING (auth.role() = 'service_role');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_school_gemini_config_school_id ON school_gemini_config(school_id);
CREATE INDEX IF NOT EXISTS idx_school_gemini_config_active ON school_gemini_config(school_id, is_active);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_school_gemini_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_school_gemini_config_updated_at
  BEFORE UPDATE ON school_gemini_config
  FOR EACH ROW
  EXECUTE FUNCTION update_school_gemini_config_updated_at();

-- Comments for documentation
COMMENT ON TABLE school_gemini_config IS 'School-level Gemini AI configuration for admin AI assistant features';
COMMENT ON COLUMN school_gemini_config.api_key IS 'Gemini API key stored in plain text for school-wide admin access';
COMMENT ON COLUMN school_gemini_config.selected_model IS 'Selected Gemini model (gemini-1.5-flash, gemini-1.5-pro, gemini-pro)';
COMMENT ON COLUMN school_gemini_config.configured_by IS 'Admin user who configured this API key';
