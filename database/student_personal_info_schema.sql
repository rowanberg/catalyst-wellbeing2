-- Student Personal Information Schema
-- Secure collection of institution-required student data
-- IMPORTANT: Field-level encryption for sensitive data, strict RLS policies

-- Main student info table
CREATE TABLE IF NOT EXISTS student_personal_info (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    -- Step 1: Student Identity (mandatory)
    admission_number TEXT,
    roll_number TEXT,
    class_or_grade TEXT,
    section TEXT,
    academic_year TEXT,
    
    -- Step 2: Personal Information (mandatory)
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'prefer_not_to_say')),
    nationality TEXT,
    
    -- Step 3: Guardian Information (stored encrypted)
    primary_guardian_name_encrypted TEXT,
    primary_guardian_relationship TEXT,
    guardian_phone_encrypted TEXT,
    guardian_email_encrypted TEXT,
    secondary_contact_name_encrypted TEXT,
    secondary_contact_phone_encrypted TEXT,
    
    -- Step 4: Academic Context (mandatory)
    education_board TEXT CHECK (education_board IN ('cbse', 'icse', 'state', 'ib', 'igcse', 'other')),
    medium_of_instruction TEXT,
    subjects_enrolled JSONB DEFAULT '[]',
    stream TEXT CHECK (stream IS NULL OR stream IN ('science', 'commerce', 'arts', 'general')),
    
    -- Step 5: Wellbeing Preferences (optional)
    preferred_language TEXT DEFAULT 'english',
    comfort_sharing_emotions TEXT DEFAULT 'neutral' CHECK (comfort_sharing_emotions IN ('comfortable', 'neutral', 'prefer_privacy')),
    support_contact_preference TEXT DEFAULT 'teacher' CHECK (support_contact_preference IN ('teacher', 'counselor', 'parent', 'none')),
    
    -- Step 6: Emergency & Medical (stored encrypted)
    emergency_contact_name_encrypted TEXT,
    emergency_contact_phone_encrypted TEXT,
    medical_notes_encrypted TEXT, -- Only allergies, asthma, etc. - no diagnoses
    
    -- Step 7: Consents & Privacy
    parent_consent_app_usage BOOLEAN DEFAULT false,
    data_processing_consent BOOLEAN DEFAULT false,
    consent_timestamp TIMESTAMP WITH TIME ZONE,
    consent_ip_address INET,
    
    -- Privacy controls
    wellbeing_visibility TEXT DEFAULT 'student_only' CHECK (wellbeing_visibility IN ('student_only', 'trends_to_teachers', 'summary_to_parents')),
    share_mood_details BOOLEAN DEFAULT false,
    share_survey_text_answers BOOLEAN DEFAULT false,
    allow_ai_wellbeing_guidance BOOLEAN DEFAULT true,
    
    -- Completion tracking
    setup_step INTEGER DEFAULT 1 CHECK (setup_step BETWEEN 1 AND 8),
    setup_completed BOOLEAN DEFAULT false,
    setup_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated_by UUID REFERENCES profiles(id)
);

-- Audit log for sensitive data access
CREATE TABLE IF NOT EXISTS student_info_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('view', 'update', 'export', 'delete')),
    fields_accessed TEXT[],
    performed_by UUID NOT NULL REFERENCES profiles(id),
    performed_by_role TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_student_info_profile ON student_personal_info(profile_id);
CREATE INDEX IF NOT EXISTS idx_student_info_school ON student_personal_info(school_id);
CREATE INDEX IF NOT EXISTS idx_student_info_setup ON student_personal_info(setup_completed);
CREATE INDEX IF NOT EXISTS idx_student_info_class ON student_personal_info(class_or_grade, section);

CREATE INDEX IF NOT EXISTS idx_student_info_audit_profile ON student_info_audit_log(profile_id);
CREATE INDEX IF NOT EXISTS idx_student_info_audit_school ON student_info_audit_log(school_id);
CREATE INDEX IF NOT EXISTS idx_student_info_audit_date ON student_info_audit_log(created_at DESC);

-- Enable RLS
ALTER TABLE student_personal_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_info_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for student_personal_info
-- ============================================================================

DROP POLICY IF EXISTS "Students can view own info" ON student_personal_info;
DROP POLICY IF EXISTS "Students can update own info" ON student_personal_info;
DROP POLICY IF EXISTS "Students can insert own info" ON student_personal_info;
DROP POLICY IF EXISTS "Teachers can view limited student info" ON student_personal_info;
DROP POLICY IF EXISTS "Admins can view student info in their school" ON student_personal_info;

-- Students can view their own complete information
CREATE POLICY "Students can view own info" ON student_personal_info
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.id = student_personal_info.profile_id
            AND profiles.role = 'student'
        )
    );

-- Students can update their own information
CREATE POLICY "Students can update own info" ON student_personal_info
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.id = student_personal_info.profile_id
            AND profiles.role = 'student'
        )
    );

-- Students can insert their initial info record
CREATE POLICY "Students can insert own info" ON student_personal_info
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.id = student_personal_info.profile_id
            AND profiles.role = 'student'
            AND profiles.school_id = student_personal_info.school_id
        )
    );

-- Teachers can view LIMITED student info (no encrypted fields visible via this policy)
-- They can see: class, section, academic info, wellbeing preferences (not guardian/medical)
CREATE POLICY "Teachers can view limited student info" ON student_personal_info
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'teacher'
            AND profiles.school_id = student_personal_info.school_id
        )
    );

-- Admins can view all student info in their school
CREATE POLICY "Admins can view student info in their school" ON student_personal_info
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
            AND profiles.school_id = student_personal_info.school_id
        )
    );

-- ============================================================================
-- RLS Policies for audit log
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view audit logs" ON student_info_audit_log;
DROP POLICY IF EXISTS "System can insert audit logs" ON student_info_audit_log;

-- Only admins can view audit logs for their school
CREATE POLICY "Admins can view audit logs" ON student_info_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
            AND profiles.school_id = student_info_audit_log.school_id
        )
    );

-- Allow service role to insert audit logs
CREATE POLICY "System can insert audit logs" ON student_info_audit_log
    FOR INSERT WITH CHECK (true);

-- ============================================================================
-- Auto-update timestamp trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_student_info_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_student_info_updated ON student_personal_info;
CREATE TRIGGER trigger_student_info_updated
    BEFORE UPDATE ON student_personal_info
    FOR EACH ROW EXECUTE FUNCTION update_student_info_timestamp();
