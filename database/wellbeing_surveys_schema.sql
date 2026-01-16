-- Well-being Surveys Database Schema
-- Weekly (6 questions) and Monthly (10-12 questions) pulse surveys for students
-- IMPORTANT: Data is isolated per school using school_id with proper RLS policies

-- Survey responses table
CREATE TABLE IF NOT EXISTS wellbeing_survey_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    survey_type TEXT NOT NULL CHECK (survey_type IN ('weekly', 'monthly')),
    
    -- Survey period tracking
    week_number INTEGER, -- ISO week number (1-53) for weekly surveys
    month_number INTEGER, -- Month (1-12) for monthly surveys
    year INTEGER NOT NULL,
    
    -- Weekly survey questions (6)
    overall_feeling INTEGER CHECK (overall_feeling BETWEEN 1 AND 5), -- 1=Very Hard, 5=Great
    stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 4), -- 1=Low, 4=Too Much
    sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 4), -- 1=Very Poor, 4=Good
    workload_balance INTEGER CHECK (workload_balance BETWEEN 1 AND 4), -- 1=Always overloaded, 4=No
    support_feeling INTEGER CHECK (support_feeling BETWEEN 1 AND 4), -- 1=Not at all, 4=Yes
    open_check TEXT, -- Optional text or voice note
    
    -- Monthly survey questions (additional)
    stress_frequency INTEGER CHECK (stress_frequency BETWEEN 1 AND 4), -- 1=Almost Always, 4=Rarely
    sleep_consistency INTEGER CHECK (sleep_consistency BETWEEN 1 AND 4), -- 1=Very Poor, 4=Very Consistent
    energy_levels INTEGER CHECK (energy_levels BETWEEN 1 AND 4), -- 1=Very Low, 4=High
    academic_pressure TEXT CHECK (academic_pressure IN ('homework', 'exams', 'projects', 'time_pressure', 'none')),
    emotional_safety INTEGER CHECK (emotional_safety BETWEEN 1 AND 4), -- 1=No, 4=Yes
    social_wellbeing INTEGER CHECK (social_wellbeing BETWEEN 1 AND 4), -- 1=Very Difficult, 4=Very Good
    teacher_support INTEGER CHECK (teacher_support BETWEEN 1 AND 4), -- 1=No, 4=Yes
    personal_growth INTEGER CHECK (personal_growth BETWEEN 1 AND 4), -- 1=No, 4=Yes
    positive_reflection TEXT, -- One thing that went well
    improvement_suggestion TEXT, -- Optional school improvement
    
    -- Calculated scores (0-100)
    weekly_score INTEGER CHECK (weekly_score BETWEEN 0 AND 100),
    monthly_score INTEGER CHECK (monthly_score BETWEEN 0 AND 100),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraints separately (to handle cases where week_number or month_number is NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_wellbeing_weekly_unique 
    ON wellbeing_survey_responses(student_id, survey_type, week_number, year) 
    WHERE survey_type = 'weekly';
    
CREATE UNIQUE INDEX IF NOT EXISTS idx_wellbeing_monthly_unique 
    ON wellbeing_survey_responses(student_id, survey_type, month_number, year) 
    WHERE survey_type = 'monthly';

-- Survey alerts for concerning patterns (internal use only - teachers/admins)
CREATE TABLE IF NOT EXISTS wellbeing_survey_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('low_mood', 'high_stress', 'poor_sleep', 'low_support', 'repeated_concern')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
    trigger_count INTEGER DEFAULT 1, -- Number of consecutive concerning responses
    last_response_id UUID REFERENCES wellbeing_survey_responses(id),
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES profiles(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wellbeing_responses_student ON wellbeing_survey_responses(student_id);
CREATE INDEX IF NOT EXISTS idx_wellbeing_responses_school ON wellbeing_survey_responses(school_id);
CREATE INDEX IF NOT EXISTS idx_wellbeing_responses_type ON wellbeing_survey_responses(survey_type);
CREATE INDEX IF NOT EXISTS idx_wellbeing_responses_period ON wellbeing_survey_responses(year, week_number, month_number);
CREATE INDEX IF NOT EXISTS idx_wellbeing_responses_created ON wellbeing_survey_responses(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wellbeing_alerts_student ON wellbeing_survey_alerts(student_id);
CREATE INDEX IF NOT EXISTS idx_wellbeing_alerts_school ON wellbeing_survey_alerts(school_id);
CREATE INDEX IF NOT EXISTS idx_wellbeing_alerts_unresolved ON wellbeing_survey_alerts(school_id, resolved) WHERE resolved = false;

-- Enable RLS
ALTER TABLE wellbeing_survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellbeing_survey_alerts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for wellbeing_survey_responses
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Students can view own survey responses" ON wellbeing_survey_responses;
DROP POLICY IF EXISTS "Students can insert own survey responses" ON wellbeing_survey_responses;
DROP POLICY IF EXISTS "Teachers can view survey responses in their school" ON wellbeing_survey_responses;
DROP POLICY IF EXISTS "Admins can view survey responses in their school" ON wellbeing_survey_responses;
DROP POLICY IF EXISTS "Students can view their own survey responses" ON wellbeing_survey_responses;
DROP POLICY IF EXISTS "Students can insert their own survey responses" ON wellbeing_survey_responses;
DROP POLICY IF EXISTS "Teachers can view survey scores for their school" ON wellbeing_survey_responses;

-- Students can view their OWN survey responses only
-- Joins through profiles to verify auth.uid() matches the student's profile
CREATE POLICY "Students can view own survey responses" ON wellbeing_survey_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.id = wellbeing_survey_responses.student_id
            AND profiles.role = 'student'
        )
    );

-- Students can insert their own survey responses for their school
CREATE POLICY "Students can insert own survey responses" ON wellbeing_survey_responses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.id = wellbeing_survey_responses.student_id
            AND profiles.role = 'student'
            AND profiles.school_id = wellbeing_survey_responses.school_id
        )
    );

-- Teachers can view survey responses for students in their school ONLY
CREATE POLICY "Teachers can view survey responses in their school" ON wellbeing_survey_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'teacher'
            AND profiles.school_id = wellbeing_survey_responses.school_id
        )
    );

-- Admins can view all survey responses in their school ONLY
CREATE POLICY "Admins can view survey responses in their school" ON wellbeing_survey_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
            AND profiles.school_id = wellbeing_survey_responses.school_id
        )
    );

-- ============================================================================
-- RLS Policies for wellbeing_survey_alerts
-- ============================================================================

DROP POLICY IF EXISTS "Staff can view alerts in their school" ON wellbeing_survey_alerts;
DROP POLICY IF EXISTS "Staff can update alerts in their school" ON wellbeing_survey_alerts;
DROP POLICY IF EXISTS "System can insert alerts" ON wellbeing_survey_alerts;
DROP POLICY IF EXISTS "Staff can view alerts for their school" ON wellbeing_survey_alerts;

-- Teachers and admins can view alerts for their school ONLY
CREATE POLICY "Staff can view alerts in their school" ON wellbeing_survey_alerts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('teacher', 'admin')
            AND profiles.school_id = wellbeing_survey_alerts.school_id
        )
    );

-- Teachers and admins can update (resolve) alerts in their school ONLY
CREATE POLICY "Staff can update alerts in their school" ON wellbeing_survey_alerts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('teacher', 'admin')
            AND profiles.school_id = wellbeing_survey_alerts.school_id
        )
    );

-- Allow service role to insert alerts (used by API when detecting concerning patterns)
CREATE POLICY "System can insert alerts" ON wellbeing_survey_alerts
    FOR INSERT WITH CHECK (true);

-- ============================================================================
-- Functions for score calculation
-- ============================================================================

-- Function to calculate weekly wellbeing score
CREATE OR REPLACE FUNCTION calculate_weekly_wellbeing_score(
    p_overall_feeling INTEGER,
    p_stress_level INTEGER,
    p_sleep_quality INTEGER,
    p_support_feeling INTEGER
) RETURNS INTEGER AS $$
DECLARE
    mood_score FLOAT;
    stress_score FLOAT;
    sleep_score FLOAT;
    support_score FLOAT;
    total_score INTEGER;
BEGIN
    -- Normalize to 0-100 and apply weights
    -- Mood: 30% weight (1-5 scale normalized to 0-100)
    mood_score := ((COALESCE(p_overall_feeling, 3) - 1) / 4.0) * 100 * 0.30;
    
    -- Stress: 25% weight (inverted: 1=high stress=low score, 4=low stress=high score)
    stress_score := ((5 - COALESCE(p_stress_level, 2)) / 3.0) * 100 * 0.25;
    
    -- Sleep: 25% weight (1-4 scale)
    sleep_score := ((COALESCE(p_sleep_quality, 2) - 1) / 3.0) * 100 * 0.25;
    
    -- Support: 20% weight (1-4 scale)
    support_score := ((COALESCE(p_support_feeling, 2) - 1) / 3.0) * 100 * 0.20;
    
    total_score := ROUND(mood_score + stress_score + sleep_score + support_score);
    
    RETURN LEAST(100, GREATEST(0, total_score));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-calculate scores on insert/update
CREATE OR REPLACE FUNCTION trigger_calculate_wellbeing_scores()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.survey_type = 'weekly' THEN
        NEW.weekly_score := calculate_weekly_wellbeing_score(
            NEW.overall_feeling,
            NEW.stress_level,
            NEW.sleep_quality,
            NEW.support_feeling
        );
    END IF;
    
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_wellbeing_score_calc ON wellbeing_survey_responses;
CREATE TRIGGER trigger_wellbeing_score_calc
    BEFORE INSERT OR UPDATE ON wellbeing_survey_responses
    FOR EACH ROW EXECUTE FUNCTION trigger_calculate_wellbeing_scores();
