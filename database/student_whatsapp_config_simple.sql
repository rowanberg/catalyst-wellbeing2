-- Simplified Student WhatsApp Configuration Table
-- Run this if you encounter any issues with the main schema

-- Drop existing table if it exists (be careful in production!)
-- DROP TABLE IF EXISTS student_whatsapp_config;

-- Create the student_whatsapp_config table
CREATE TABLE student_whatsapp_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL,
    phone_number TEXT,
    whatsapp_link TEXT,
    is_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint for student_id
ALTER TABLE student_whatsapp_config 
ADD CONSTRAINT unique_student_whatsapp UNIQUE (student_id);

-- Create indexes
CREATE INDEX idx_student_whatsapp_config_student_id 
ON student_whatsapp_config(student_id);

-- Enable RLS
ALTER TABLE student_whatsapp_config ENABLE ROW LEVEL SECURITY;

-- Basic RLS policy for students
CREATE POLICY "Students can manage own whatsapp config" 
ON student_whatsapp_config
FOR ALL 
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

-- Grant permissions
GRANT ALL ON student_whatsapp_config TO authenticated;

-- Add comments
COMMENT ON TABLE student_whatsapp_config IS 'Stores WhatsApp configuration for students';
COMMENT ON COLUMN student_whatsapp_config.student_id IS 'Reference to the student user';
COMMENT ON COLUMN student_whatsapp_config.phone_number IS 'WhatsApp phone number (+1234567890)';
COMMENT ON COLUMN student_whatsapp_config.whatsapp_link IS 'WhatsApp link (https://wa.me/1234567890)';
COMMENT ON COLUMN student_whatsapp_config.is_enabled IS 'Whether WhatsApp is enabled';
