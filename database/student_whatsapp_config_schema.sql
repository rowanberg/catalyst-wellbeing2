-- Student WhatsApp Configuration Table
-- Stores WhatsApp phone numbers and links for students

-- Create the student_whatsapp_config table
CREATE TABLE IF NOT EXISTS student_whatsapp_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number TEXT,
    whatsapp_link TEXT,
    is_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_student_whatsapp UNIQUE (student_id),
    CONSTRAINT valid_phone_format CHECK (
        phone_number IS NULL OR 
        (phone_number ~ '^\+[1-9]\d{7,14}$')
    ),
    CONSTRAINT valid_whatsapp_link CHECK (
        whatsapp_link IS NULL OR 
        whatsapp_link LIKE 'https://wa.me/%'
    )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_whatsapp_config_student_id 
ON student_whatsapp_config(student_id);

CREATE INDEX IF NOT EXISTS idx_student_whatsapp_config_enabled 
ON student_whatsapp_config(is_enabled) 
WHERE is_enabled = true;

-- Row Level Security (RLS) Policies
ALTER TABLE student_whatsapp_config ENABLE ROW LEVEL SECURITY;

-- Policy: Students can only access their own WhatsApp configuration
CREATE POLICY "Students can manage own whatsapp config" 
ON student_whatsapp_config
FOR ALL 
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

-- Policy: Teachers and admins can view WhatsApp configs of students in their school
CREATE POLICY "Teachers can view student whatsapp configs in their school" 
ON student_whatsapp_config
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM profiles teacher_profile
        WHERE teacher_profile.id = auth.uid()
        AND teacher_profile.role IN ('teacher', 'admin')
        AND teacher_profile.school_id = (
            SELECT school_id FROM profiles student_profile
            WHERE student_profile.id = student_whatsapp_config.student_id
        )
    )
);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_student_whatsapp_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update the updated_at column
CREATE TRIGGER update_student_whatsapp_config_updated_at_trigger
    BEFORE UPDATE ON student_whatsapp_config
    FOR EACH ROW
    EXECUTE FUNCTION update_student_whatsapp_config_updated_at();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON student_whatsapp_config TO authenticated;

-- Comments for documentation
COMMENT ON TABLE student_whatsapp_config IS 'Stores WhatsApp configuration for students including phone numbers and custom links';
COMMENT ON COLUMN student_whatsapp_config.student_id IS 'Reference to the student user';
COMMENT ON COLUMN student_whatsapp_config.phone_number IS 'Student WhatsApp phone number in international format (+1234567890)';
COMMENT ON COLUMN student_whatsapp_config.whatsapp_link IS 'Custom WhatsApp link (https://wa.me/1234567890)';
COMMENT ON COLUMN student_whatsapp_config.is_enabled IS 'Whether WhatsApp integration is enabled for this student';

-- Sample data for testing (optional)
-- INSERT INTO student_whatsapp_config (student_id, phone_number, whatsapp_link, is_enabled)
-- VALUES 
--     ('sample-student-id', '+1234567890', 'https://wa.me/1234567890', true)
-- ON CONFLICT (student_id) DO NOTHING;
