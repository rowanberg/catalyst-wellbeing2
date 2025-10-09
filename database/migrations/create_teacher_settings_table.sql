-- Teacher Settings Table Migration
-- This table stores teacher-specific settings and preferences

-- Create teacher_settings table
CREATE TABLE IF NOT EXISTS teacher_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    teacher_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Notification Settings
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    class_updates BOOLEAN DEFAULT true,
    parent_messages BOOLEAN DEFAULT true,
    system_alerts BOOLEAN DEFAULT true,
    weekly_reports BOOLEAN DEFAULT false,
    
    -- Privacy & Security Settings
    profile_visibility VARCHAR(10) DEFAULT 'school' CHECK (profile_visibility IN ('public', 'school', 'private')),
    show_email BOOLEAN DEFAULT false,
    show_phone BOOLEAN DEFAULT false,
    two_factor_auth BOOLEAN DEFAULT false,
    session_timeout INTEGER DEFAULT 30 CHECK (session_timeout BETWEEN 15 AND 120),
    
    -- Teaching Preferences
    auto_save_grades BOOLEAN DEFAULT true,
    sound_effects BOOLEAN DEFAULT true,
    animations BOOLEAN DEFAULT true,
    haptic_feedback BOOLEAN DEFAULT true,
    classroom_mode BOOLEAN DEFAULT false,
    
    -- WhatsApp Configuration
    whatsapp_enabled BOOLEAN DEFAULT false,
    whatsapp_phone_number VARCHAR(20),
    whatsapp_auto_reply BOOLEAN DEFAULT false,
    whatsapp_parent_notifications BOOLEAN DEFAULT true,
    whatsapp_student_updates BOOLEAN DEFAULT false,
    whatsapp_business_account BOOLEAN DEFAULT false,
    
    -- Gemini AI Configuration
    gemini_enabled BOOLEAN DEFAULT false,
    gemini_api_key TEXT, -- Encrypted storage recommended
    gemini_model VARCHAR(20) DEFAULT 'gemini-pro' CHECK (gemini_model IN ('gemini-pro', 'gemini-pro-vision')),
    gemini_auto_grading BOOLEAN DEFAULT false,
    gemini_content_generation BOOLEAN DEFAULT false,
    gemini_student_support BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teacher_settings_teacher_id ON teacher_settings(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_settings_whatsapp_enabled ON teacher_settings(whatsapp_enabled);
CREATE INDEX IF NOT EXISTS idx_teacher_settings_gemini_enabled ON teacher_settings(gemini_enabled);

-- Enable Row Level Security
ALTER TABLE teacher_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teacher_settings
DROP POLICY IF EXISTS "Teachers can view own settings" ON teacher_settings;
DROP POLICY IF EXISTS "Teachers can update own settings" ON teacher_settings;
DROP POLICY IF EXISTS "Teachers can insert own settings" ON teacher_settings;

CREATE POLICY "Teachers can view own settings" ON teacher_settings 
    FOR SELECT USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update own settings" ON teacher_settings 
    FOR UPDATE USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert own settings" ON teacher_settings 
    FOR INSERT WITH CHECK (auth.uid() = teacher_id);

-- Allow admins to view teacher settings from their school
CREATE POLICY "Admins can view teacher settings from their school" ON teacher_settings 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p1
            WHERE p1.user_id = auth.uid() 
            AND p1.role = 'admin'
            AND EXISTS (
                SELECT 1 FROM profiles p2
                WHERE p2.user_id = teacher_settings.teacher_id
                AND p2.school_id = p1.school_id
            )
        )
    );

-- Trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_teacher_settings_updated_at ON teacher_settings;
CREATE TRIGGER update_teacher_settings_updated_at 
    BEFORE UPDATE ON teacher_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get or create teacher settings with defaults
CREATE OR REPLACE FUNCTION get_or_create_teacher_settings(teacher_user_id UUID)
RETURNS teacher_settings AS $$
DECLARE
    settings_record teacher_settings;
BEGIN
    -- Try to get existing settings
    SELECT * INTO settings_record 
    FROM teacher_settings 
    WHERE teacher_id = teacher_user_id;
    
    -- If no settings exist, create default settings
    IF NOT FOUND THEN
        INSERT INTO teacher_settings (teacher_id)
        VALUES (teacher_user_id)
        RETURNING * INTO settings_record;
    END IF;
    
    RETURN settings_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update teacher settings efficiently
CREATE OR REPLACE FUNCTION update_teacher_settings(
    teacher_user_id UUID,
    settings_json JSONB
)
RETURNS teacher_settings AS $$
DECLARE
    settings_record teacher_settings;
    updated_record teacher_settings;
BEGIN
    -- Get or create settings first
    SELECT * INTO settings_record FROM get_or_create_teacher_settings(teacher_user_id);
    
    -- Update with provided JSON data
    UPDATE teacher_settings SET
        email_notifications = COALESCE((settings_json->>'emailNotifications')::boolean, email_notifications),
        push_notifications = COALESCE((settings_json->>'pushNotifications')::boolean, push_notifications),
        class_updates = COALESCE((settings_json->>'classUpdates')::boolean, class_updates),
        parent_messages = COALESCE((settings_json->>'parentMessages')::boolean, parent_messages),
        system_alerts = COALESCE((settings_json->>'systemAlerts')::boolean, system_alerts),
        weekly_reports = COALESCE((settings_json->>'weeklyReports')::boolean, weekly_reports),
        
        profile_visibility = COALESCE(settings_json->>'profileVisibility', profile_visibility),
        show_email = COALESCE((settings_json->>'showEmail')::boolean, show_email),
        show_phone = COALESCE((settings_json->>'showPhone')::boolean, show_phone),
        two_factor_auth = COALESCE((settings_json->>'twoFactorAuth')::boolean, two_factor_auth),
        session_timeout = COALESCE((settings_json->>'sessionTimeout')::integer, session_timeout),
        
        auto_save_grades = COALESCE((settings_json->>'autoSaveGrades')::boolean, auto_save_grades),
        sound_effects = COALESCE((settings_json->>'soundEffects')::boolean, sound_effects),
        animations = COALESCE((settings_json->>'animations')::boolean, animations),
        haptic_feedback = COALESCE((settings_json->>'hapticFeedback')::boolean, haptic_feedback),
        classroom_mode = COALESCE((settings_json->>'classroomMode')::boolean, classroom_mode),
        
        whatsapp_enabled = COALESCE((settings_json->>'whatsappEnabled')::boolean, whatsapp_enabled),
        whatsapp_phone_number = COALESCE(settings_json->>'whatsappPhoneNumber', whatsapp_phone_number),
        whatsapp_auto_reply = COALESCE((settings_json->>'whatsappAutoReply')::boolean, whatsapp_auto_reply),
        whatsapp_parent_notifications = COALESCE((settings_json->>'whatsappParentNotifications')::boolean, whatsapp_parent_notifications),
        whatsapp_student_updates = COALESCE((settings_json->>'whatsappStudentUpdates')::boolean, whatsapp_student_updates),
        whatsapp_business_account = COALESCE((settings_json->>'whatsappBusinessAccount')::boolean, whatsapp_business_account),
        
        gemini_enabled = COALESCE((settings_json->>'geminiEnabled')::boolean, gemini_enabled),
        gemini_api_key = COALESCE(settings_json->>'geminiApiKey', gemini_api_key),
        gemini_model = COALESCE(settings_json->>'geminiModel', gemini_model),
        gemini_auto_grading = COALESCE((settings_json->>'geminiAutoGrading')::boolean, gemini_auto_grading),
        gemini_content_generation = COALESCE((settings_json->>'geminiContentGeneration')::boolean, gemini_content_generation),
        gemini_student_support = COALESCE((settings_json->>'geminiStudentSupport')::boolean, gemini_student_support),
        
        updated_at = NOW()
    WHERE teacher_id = teacher_user_id
    RETURNING * INTO updated_record;
    
    RETURN updated_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON teacher_settings TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_teacher_settings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_teacher_settings(UUID, JSONB) TO authenticated;
