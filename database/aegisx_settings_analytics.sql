-- =====================================================
-- AegisX Settings & Analytics Enhancement
-- =====================================================
-- This extends the AegisX system with settings management
-- and enhanced analytics capabilities
-- =====================================================

-- =====================================================
-- SYSTEM SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS aegisx_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    -- Logging Settings
    access_logging_enabled BOOLEAN DEFAULT true,
    log_retention_days INTEGER DEFAULT 365, -- Keep logs for 1 year by default
    auto_archive_enabled BOOLEAN DEFAULT true,
    
    -- Security Settings
    deny_unknown_cards BOOLEAN DEFAULT true,
    card_expiry_warning_days INTEGER DEFAULT 30,
    max_failed_attempts INTEGER DEFAULT 3,
    lock_duration_minutes INTEGER DEFAULT 30,
    require_pin_for_sensitive_areas BOOLEAN DEFAULT false,
    
    -- Notification Settings
    realtime_alerts_enabled BOOLEAN DEFAULT true,
    email_notifications_enabled BOOLEAN DEFAULT false,
    admin_email VARCHAR(255),
    alert_threshold_per_hour INTEGER DEFAULT 10,
    daily_summary_enabled BOOLEAN DEFAULT true,
    summary_time TIME DEFAULT '18:00:00',
    
    -- Reader Settings
    auto_sync_interval_minutes INTEGER DEFAULT 5,
    offline_mode_enabled BOOLEAN DEFAULT true,
    reader_health_check_enabled BOOLEAN DEFAULT true,
    auto_restart_on_failure BOOLEAN DEFAULT false,
    
    -- Data Management
    export_enabled BOOLEAN DEFAULT true,
    backup_enabled BOOLEAN DEFAULT true,
    backup_frequency_days INTEGER DEFAULT 7,
    gdpr_compliance_mode BOOLEAN DEFAULT true,
    
    -- Traffic Analytics
    hourly_analytics_enabled BOOLEAN DEFAULT true,
    student_tracking_enabled BOOLEAN DEFAULT true,
    peak_hours_alerts BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- HOURLY TRAFFIC ANALYTICS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS aegisx_hourly_traffic (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    reader_id UUID REFERENCES nfc_readers(id) ON DELETE CASCADE,
    
    -- Time bucket
    hour_start TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Metrics
    total_scans INTEGER DEFAULT 0,
    successful_scans INTEGER DEFAULT 0,
    denied_scans INTEGER DEFAULT 0,
    unique_students INTEGER DEFAULT 0,
    unique_staff INTEGER DEFAULT 0,
    
    -- Peak indicators
    is_peak_hour BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(reader_id, hour_start)
);

-- =====================================================
-- STUDENT CARD HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS student_card_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_id UUID REFERENCES nfc_cards(id) ON DELETE SET NULL,
    
    -- Event details
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('card_linked', 'card_unlinked', 'card_expired', 'card_lost', 'card_stolen', 'card_renewed', 'pin_changed', 'card_locked', 'card_unlocked')),
    event_details JSONB,
    
    -- Previous values (for audit trail)
    previous_status VARCHAR(20),
    new_status VARCHAR(20),
    
    -- Who made the change
    changed_by UUID REFERENCES auth.users(id),
    changed_by_role VARCHAR(20),
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- READER HEALTH LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS reader_health_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reader_id UUID NOT NULL REFERENCES nfc_readers(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    -- Health metrics
    status VARCHAR(20) NOT NULL,
    uptime_seconds INTEGER,
    memory_usage_mb INTEGER,
    cpu_usage_percent DECIMAL(5,2),
    last_successful_scan TIMESTAMP WITH TIME ZONE,
    error_count INTEGER DEFAULT 0,
    warning_count INTEGER DEFAULT 0,
    
    -- Diagnostic info
    diagnostic_info JSONB,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Settings indexes
CREATE INDEX IF NOT EXISTS idx_aegisx_settings_school ON aegisx_settings(school_id);

-- Hourly traffic indexes
CREATE INDEX IF NOT EXISTS idx_hourly_traffic_school ON aegisx_hourly_traffic(school_id);
CREATE INDEX IF NOT EXISTS idx_hourly_traffic_reader ON aegisx_hourly_traffic(reader_id);
CREATE INDEX IF NOT EXISTS idx_hourly_traffic_hour ON aegisx_hourly_traffic(hour_start DESC);
CREATE INDEX IF NOT EXISTS idx_hourly_traffic_peak ON aegisx_hourly_traffic(is_peak_hour) WHERE is_peak_hour = true;

-- Student card history indexes
CREATE INDEX IF NOT EXISTS idx_card_history_school ON student_card_history(school_id);
CREATE INDEX IF NOT EXISTS idx_card_history_student ON student_card_history(student_id);
CREATE INDEX IF NOT EXISTS idx_card_history_card ON student_card_history(card_id);
CREATE INDEX IF NOT EXISTS idx_card_history_created ON student_card_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_card_history_event_type ON student_card_history(event_type);

-- Reader health logs indexes
CREATE INDEX IF NOT EXISTS idx_reader_health_reader ON reader_health_logs(reader_id);
CREATE INDEX IF NOT EXISTS idx_reader_health_school ON reader_health_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_reader_health_created ON reader_health_logs(created_at DESC);

-- =====================================================
-- FUNCTIONS FOR ANALYTICS
-- =====================================================

-- Function to update hourly traffic
CREATE OR REPLACE FUNCTION update_hourly_traffic(
    p_reader_id UUID,
    p_access_granted BOOLEAN,
    p_student_id UUID DEFAULT NULL,
    p_user_role VARCHAR DEFAULT 'student'
)
RETURNS void AS $$
DECLARE
    v_hour_start TIMESTAMP WITH TIME ZONE;
    v_school_id UUID;
BEGIN
    -- Get current hour bucket
    v_hour_start := DATE_TRUNC('hour', NOW());
    
    -- Get school_id from reader
    SELECT school_id INTO v_school_id FROM nfc_readers WHERE id = p_reader_id;
    
    -- Insert or update hourly traffic
    INSERT INTO aegisx_hourly_traffic (
        school_id,
        reader_id,
        hour_start,
        total_scans,
        successful_scans,
        denied_scans,
        unique_students,
        unique_staff
    ) VALUES (
        v_school_id,
        p_reader_id,
        v_hour_start,
        1,
        CASE WHEN p_access_granted THEN 1 ELSE 0 END,
        CASE WHEN NOT p_access_granted THEN 1 ELSE 0 END,
        CASE WHEN p_access_granted AND p_user_role = 'student' THEN 1 ELSE 0 END,
        CASE WHEN p_access_granted AND p_user_role != 'student' THEN 1 ELSE 0 END
    )
    ON CONFLICT (reader_id, hour_start)
    DO UPDATE SET
        total_scans = aegisx_hourly_traffic.total_scans + 1,
        successful_scans = aegisx_hourly_traffic.successful_scans + CASE WHEN p_access_granted THEN 1 ELSE 0 END,
        denied_scans = aegisx_hourly_traffic.denied_scans + CASE WHEN NOT p_access_granted THEN 1 ELSE 0 END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get traffic analytics for a date range
CREATE OR REPLACE FUNCTION get_traffic_analytics(
    p_school_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    hour TIMESTAMP WITH TIME ZONE,
    total_scans BIGINT,
    successful_scans BIGINT,
    denied_scans BIGINT,
    unique_students BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        hour_start,
        SUM(total_scans)::BIGINT,
        SUM(successful_scans)::BIGINT,
        SUM(denied_scans)::BIGINT,
        SUM(unique_students)::BIGINT
    FROM aegisx_hourly_traffic
    WHERE school_id = p_school_id
    AND hour_start >= p_start_date
    AND hour_start < p_end_date
    GROUP BY hour_start
    ORDER BY hour_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get student card history
CREATE OR REPLACE FUNCTION get_student_card_history(p_student_id UUID)
RETURNS TABLE (
    id UUID,
    event_type VARCHAR,
    event_details JSONB,
    previous_status VARCHAR,
    new_status VARCHAR,
    changed_by_role VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id,
        h.event_type,
        h.event_details,
        h.previous_status,
        h.new_status,
        h.changed_by_role,
        h.created_at
    FROM student_card_history h
    WHERE h.student_id = p_student_id
    ORDER BY h.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to initialize default settings for a school
CREATE OR REPLACE FUNCTION initialize_aegisx_settings(p_school_id UUID)
RETURNS UUID AS $$
DECLARE
    v_settings_id UUID;
BEGIN
    INSERT INTO aegisx_settings (school_id)
    VALUES (p_school_id)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_settings_id;
    
    RETURN v_settings_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log card event
CREATE OR REPLACE FUNCTION log_card_event(
    p_student_id UUID,
    p_card_id UUID,
    p_event_type VARCHAR,
    p_event_details JSONB,
    p_previous_status VARCHAR DEFAULT NULL,
    p_new_status VARCHAR DEFAULT NULL,
    p_changed_by UUID DEFAULT NULL,
    p_changed_by_role VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_school_id UUID;
    v_event_id UUID;
BEGIN
    -- Get school_id from student
    SELECT school_id INTO v_school_id 
    FROM profiles 
    WHERE user_id = p_student_id;
    
    -- Insert event
    INSERT INTO student_card_history (
        school_id,
        student_id,
        card_id,
        event_type,
        event_details,
        previous_status,
        new_status,
        changed_by,
        changed_by_role
    ) VALUES (
        v_school_id,
        p_student_id,
        p_card_id,
        p_event_type,
        p_event_details,
        p_previous_status,
        p_new_status,
        p_changed_by,
        p_changed_by_role
    ) RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to update updated_at on settings
CREATE OR REPLACE FUNCTION update_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_settings_timestamp ON aegisx_settings;
CREATE TRIGGER trigger_update_settings_timestamp
    BEFORE UPDATE ON aegisx_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_settings_timestamp();

-- Trigger to log card status changes
CREATE OR REPLACE FUNCTION log_card_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        PERFORM log_card_event(
            NEW.student_id,
            NEW.id,
            CASE 
                WHEN NEW.status = 'lost' THEN 'card_lost'
                WHEN NEW.status = 'stolen' THEN 'card_stolen'
                WHEN NEW.status = 'expired' THEN 'card_expired'
                WHEN NEW.status = 'active' AND OLD.status = 'inactive' THEN 'card_renewed'
                ELSE 'card_status_changed'
            END,
            jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status),
            OLD.status,
            NEW.status,
            auth.uid(),
            'admin'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_card_status_change ON nfc_cards;
CREATE TRIGGER trigger_log_card_status_change
    AFTER UPDATE ON nfc_cards
    FOR EACH ROW
    EXECUTE FUNCTION log_card_status_change();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE aegisx_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE aegisx_hourly_traffic ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_card_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE reader_health_logs ENABLE ROW LEVEL SECURITY;

-- Settings policies
DROP POLICY IF EXISTS "Admins can manage settings in their school" ON aegisx_settings;
CREATE POLICY "Admins can manage settings in their school" ON aegisx_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
            AND profiles.school_id = aegisx_settings.school_id
        )
    );

-- Hourly traffic policies
DROP POLICY IF EXISTS "Admins can view traffic in their school" ON aegisx_hourly_traffic;
CREATE POLICY "Admins can view traffic in their school" ON aegisx_hourly_traffic
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'teacher')
            AND profiles.school_id = aegisx_hourly_traffic.school_id
        )
    );

-- Card history policies
DROP POLICY IF EXISTS "Students can view own card history" ON student_card_history;
CREATE POLICY "Students can view own card history" ON student_card_history
    FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Admins can view card history in their school" ON student_card_history;
CREATE POLICY "Admins can view card history in their school" ON student_card_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
            AND profiles.school_id = student_card_history.school_id
        )
    );

-- Reader health policies
DROP POLICY IF EXISTS "Admins can view reader health in their school" ON reader_health_logs;
CREATE POLICY "Admins can view reader health in their school" ON reader_health_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
            AND profiles.school_id = reader_health_logs.school_id
        )
    );

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION update_hourly_traffic(UUID, BOOLEAN, UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_traffic_analytics(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_card_history(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_aegisx_settings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_card_event(UUID, UUID, VARCHAR, JSONB, VARCHAR, VARCHAR, UUID, VARCHAR) TO authenticated;

-- =====================================================
-- END OF SCHEMA
-- =====================================================

SELECT 'AegisX Settings & Analytics Enhancement completed successfully!' as status;
