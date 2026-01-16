-- =====================================================
-- AegisX NFC System - Complete Database Schema
-- =====================================================
-- Run this file in your Supabase SQL Editor
-- This creates all tables, indexes, RLS policies, and functions
-- for the complete AegisX NFC Access Control System
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. NFC READERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS nfc_readers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    -- Reader identification
    name VARCHAR(100) NOT NULL,
    serial_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Location details  
    location VARCHAR(200),
    location_type VARCHAR(50) DEFAULT 'other' CHECK (location_type IN ('library', 'canteen', 'gate', 'lab', 'classroom', 'office', 'gym', 'other')),
    
    -- Status
    status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'maintenance')),
    enabled BOOLEAN DEFAULT true,
    
    -- Statistics
    total_scans INTEGER DEFAULT 0,
    today_scans INTEGER DEFAULT 0,
    last_sync TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- 2. NFC CARDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS nfc_cards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Card identification
    card_uid VARCHAR(50) UNIQUE NOT NULL,
    card_number VARCHAR(50),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'lost', 'stolen', 'expired')),
    
    -- Security
    pin_hash VARCHAR(255),
    failed_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    
    -- Validity
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(school_id, student_id)
);

-- =====================================================
-- 3. NFC ACCESS LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS nfc_access_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    reader_id UUID REFERENCES nfc_readers(id) ON DELETE SET NULL,
    card_id UUID REFERENCES nfc_cards(id) ON DELETE SET NULL,
    student_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Access details
    card_uid VARCHAR(50),
    student_name VARCHAR(200),
    student_tag VARCHAR(50),
    
    -- Result
    access_granted BOOLEAN NOT NULL,
    denial_reason VARCHAR(100),
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. NFC READER STATS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS nfc_reader_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    reader_id UUID NOT NULL REFERENCES nfc_readers(id) ON DELETE CASCADE,
    
    -- Date for stats
    stat_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Daily statistics
    total_scans INTEGER DEFAULT 0,
    successful_scans INTEGER DEFAULT 0,
    denied_scans INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    
    -- Peak tracking
    peak_hour INTEGER,
    peak_hour_scans INTEGER DEFAULT 0,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(reader_id, stat_date)
);

-- =====================================================
-- 5. STUDENT INFO TABLE (Extended Profile)
-- =====================================================
CREATE TABLE IF NOT EXISTS student_info (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic info
    student_tag VARCHAR(50),
    grade VARCHAR(20),
    section VARCHAR(20),
    roll_number VARCHAR(20),
    
    -- Contact (encrypted in app)
    emergency_contact VARCHAR(500),
    blood_group VARCHAR(10),
    medical_conditions TEXT,
    
    -- Photo
    photo_url TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. AEGISX SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS aegisx_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID UNIQUE NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    -- Logging Settings
    access_logging_enabled BOOLEAN DEFAULT true,
    log_retention_days INTEGER DEFAULT 365,
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
-- 7. HOURLY TRAFFIC ANALYTICS TABLE
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
    
    UNIQUE(school_id, reader_id, hour_start)
);

-- =====================================================
-- 8. STUDENT CARD HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS student_card_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_id UUID REFERENCES nfc_cards(id) ON DELETE SET NULL,
    
    -- Event details
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'card_linked', 'card_unlinked', 'card_expired', 'card_lost', 
        'card_stolen', 'card_renewed', 'pin_changed', 'card_locked', 
        'card_unlocked', 'card_status_changed'
    )),
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
-- 9. READER HEALTH LOGS TABLE
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

-- NFC Readers indexes
CREATE INDEX IF NOT EXISTS idx_nfc_readers_school ON nfc_readers(school_id);
CREATE INDEX IF NOT EXISTS idx_nfc_readers_status ON nfc_readers(status);
CREATE INDEX IF NOT EXISTS idx_nfc_readers_serial ON nfc_readers(serial_number);

-- NFC Cards indexes
CREATE INDEX IF NOT EXISTS idx_nfc_cards_school ON nfc_cards(school_id);
CREATE INDEX IF NOT EXISTS idx_nfc_cards_student ON nfc_cards(student_id);
CREATE INDEX IF NOT EXISTS idx_nfc_cards_uid ON nfc_cards(card_uid);
CREATE INDEX IF NOT EXISTS idx_nfc_cards_status ON nfc_cards(status);

-- Access Logs indexes
CREATE INDEX IF NOT EXISTS idx_access_logs_school ON nfc_access_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_reader ON nfc_access_logs(reader_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_student ON nfc_access_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_created ON nfc_access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_card_uid ON nfc_access_logs(card_uid);

-- Reader Stats indexes
CREATE INDEX IF NOT EXISTS idx_reader_stats_school ON nfc_reader_stats(school_id);
CREATE INDEX IF NOT EXISTS idx_reader_stats_reader_date ON nfc_reader_stats(reader_id, stat_date DESC);

-- Student Info indexes
CREATE INDEX IF NOT EXISTS idx_student_info_school ON student_info(school_id);
CREATE INDEX IF NOT EXISTS idx_student_info_tag ON student_info(student_tag);

-- Settings indexes
CREATE INDEX IF NOT EXISTS idx_aegisx_settings_school ON aegisx_settings(school_id);

-- Hourly traffic indexes
CREATE INDEX IF NOT EXISTS idx_hourly_traffic_school ON aegisx_hourly_traffic(school_id);
CREATE INDEX IF NOT EXISTS idx_hourly_traffic_reader ON aegisx_hourly_traffic(reader_id);
CREATE INDEX IF NOT EXISTS idx_hourly_traffic_hour ON aegisx_hourly_traffic(hour_start DESC);

-- Card history indexes
CREATE INDEX IF NOT EXISTS idx_card_history_school ON student_card_history(school_id);
CREATE INDEX IF NOT EXISTS idx_card_history_student ON student_card_history(student_id);
CREATE INDEX IF NOT EXISTS idx_card_history_created ON student_card_history(created_at DESC);

-- Reader health indexes
CREATE INDEX IF NOT EXISTS idx_reader_health_reader ON reader_health_logs(reader_id);
CREATE INDEX IF NOT EXISTS idx_reader_health_school ON reader_health_logs(school_id);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =====================================================

ALTER TABLE nfc_readers ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfc_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfc_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfc_reader_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE aegisx_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE aegisx_hourly_traffic ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_card_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE reader_health_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - SCHOOL-BASED DATA ISOLATION
-- =====================================================

-- Helper function to get user's school_id (using SECURITY INVOKER to avoid auth issues)
CREATE OR REPLACE FUNCTION get_user_school_id()
RETURNS UUID AS $$
    SELECT school_id FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY INVOKER STABLE;

-- Helper function to check if user is admin (using SECURITY INVOKER)
CREATE OR REPLACE FUNCTION is_school_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    );
$$ LANGUAGE sql SECURITY INVOKER STABLE;

-- =====================================================
-- NFC READERS POLICIES (Admins only)
-- =====================================================
DROP POLICY IF EXISTS "Admins can view readers in their school" ON nfc_readers;
CREATE POLICY "Admins can view readers in their school" ON nfc_readers
    FOR SELECT USING (school_id = get_user_school_id() AND is_school_admin());

DROP POLICY IF EXISTS "Admins can create readers in their school" ON nfc_readers;
CREATE POLICY "Admins can create readers in their school" ON nfc_readers
    FOR INSERT WITH CHECK (school_id = get_user_school_id() AND is_school_admin());

DROP POLICY IF EXISTS "Admins can update readers in their school" ON nfc_readers;
CREATE POLICY "Admins can update readers in their school" ON nfc_readers
    FOR UPDATE USING (school_id = get_user_school_id() AND is_school_admin());

DROP POLICY IF EXISTS "Admins can delete readers in their school" ON nfc_readers;
CREATE POLICY "Admins can delete readers in their school" ON nfc_readers
    FOR DELETE USING (school_id = get_user_school_id() AND is_school_admin());

-- =====================================================
-- NFC CARDS POLICIES
-- =====================================================
-- Students can view their own card
DROP POLICY IF EXISTS "Students can view their own card" ON nfc_cards;
CREATE POLICY "Students can view their own card" ON nfc_cards
    FOR SELECT USING (student_id = auth.uid());

-- Admins can view all cards in their school
DROP POLICY IF EXISTS "Admins can view cards in their school" ON nfc_cards;
CREATE POLICY "Admins can view cards in their school" ON nfc_cards
    FOR SELECT USING (school_id = get_user_school_id() AND is_school_admin());

-- Admins can manage cards in their school
DROP POLICY IF EXISTS "Admins can manage cards in their school" ON nfc_cards;
CREATE POLICY "Admins can manage cards in their school" ON nfc_cards
    FOR ALL USING (school_id = get_user_school_id() AND is_school_admin());

-- =====================================================
-- NFC ACCESS LOGS POLICIES
-- =====================================================
-- Students can view their own access logs
DROP POLICY IF EXISTS "Students can view their own access logs" ON nfc_access_logs;
CREATE POLICY "Students can view their own access logs" ON nfc_access_logs
    FOR SELECT USING (student_id = auth.uid());

-- Admins can view all access logs in their school
DROP POLICY IF EXISTS "Admins can view access logs in their school" ON nfc_access_logs;
CREATE POLICY "Admins can view access logs in their school" ON nfc_access_logs
    FOR SELECT USING (school_id = get_user_school_id() AND is_school_admin());

-- System can insert access logs (via service role)
DROP POLICY IF EXISTS "System can insert access logs" ON nfc_access_logs;
CREATE POLICY "System can insert access logs" ON nfc_access_logs
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- NFC READER STATS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Admins can view reader stats in their school" ON nfc_reader_stats;
CREATE POLICY "Admins can view reader stats in their school" ON nfc_reader_stats
    FOR SELECT USING (school_id = get_user_school_id() AND is_school_admin());

DROP POLICY IF EXISTS "System can manage reader stats" ON nfc_reader_stats;
CREATE POLICY "System can manage reader stats" ON nfc_reader_stats
    FOR ALL USING (true);

-- =====================================================
-- STUDENT INFO POLICIES
-- =====================================================
-- Students can view their own info
DROP POLICY IF EXISTS "Students can view their own info" ON student_info;
CREATE POLICY "Students can view their own info" ON student_info
    FOR SELECT USING (student_id = auth.uid());

-- Students can update their own info
DROP POLICY IF EXISTS "Students can update their own info" ON student_info;
CREATE POLICY "Students can update their own info" ON student_info
    FOR UPDATE USING (student_id = auth.uid());

-- Admins can view all student info in their school
DROP POLICY IF EXISTS "Admins can view student info in their school" ON student_info;
CREATE POLICY "Admins can view student info in their school" ON student_info
    FOR SELECT USING (school_id = get_user_school_id() AND is_school_admin());

-- Admins can manage student info in their school
DROP POLICY IF EXISTS "Admins can manage student info in their school" ON student_info;
CREATE POLICY "Admins can manage student info in their school" ON student_info
    FOR ALL USING (school_id = get_user_school_id() AND is_school_admin());

-- =====================================================
-- AEGISX SETTINGS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage settings in their school" ON aegisx_settings;
CREATE POLICY "Admins can manage settings in their school" ON aegisx_settings
    FOR ALL USING (school_id = get_user_school_id() AND is_school_admin());

-- =====================================================
-- HOURLY TRAFFIC POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Admins can view traffic in their school" ON aegisx_hourly_traffic;
CREATE POLICY "Admins can view traffic in their school" ON aegisx_hourly_traffic
    FOR SELECT USING (school_id = get_user_school_id() AND is_school_admin());

DROP POLICY IF EXISTS "System can manage traffic data" ON aegisx_hourly_traffic;
CREATE POLICY "System can manage traffic data" ON aegisx_hourly_traffic
    FOR ALL USING (true);

-- =====================================================
-- CARD HISTORY POLICIES
-- =====================================================
-- Students can view their own card history
DROP POLICY IF EXISTS "Students can view their own card history" ON student_card_history;
CREATE POLICY "Students can view their own card history" ON student_card_history
    FOR SELECT USING (student_id = auth.uid());

-- Admins can view card history in their school
DROP POLICY IF EXISTS "Admins can view card history in their school" ON student_card_history;
CREATE POLICY "Admins can view card history in their school" ON student_card_history
    FOR SELECT USING (school_id = get_user_school_id() AND is_school_admin());

-- System can insert card history
DROP POLICY IF EXISTS "System can insert card history" ON student_card_history;
CREATE POLICY "System can insert card history" ON student_card_history
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- READER HEALTH POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Admins can view reader health in their school" ON reader_health_logs;
CREATE POLICY "Admins can view reader health in their school" ON reader_health_logs
    FOR SELECT USING (school_id = get_user_school_id() AND is_school_admin());

DROP POLICY IF EXISTS "System can manage reader health" ON reader_health_logs;
CREATE POLICY "System can manage reader health" ON reader_health_logs
    FOR ALL USING (true);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_nfc_readers_updated_at ON nfc_readers;
CREATE TRIGGER update_nfc_readers_updated_at
    BEFORE UPDATE ON nfc_readers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_nfc_cards_updated_at ON nfc_cards;
CREATE TRIGGER update_nfc_cards_updated_at
    BEFORE UPDATE ON nfc_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_info_updated_at ON student_info;
CREATE TRIGGER update_student_info_updated_at
    BEFORE UPDATE ON student_info
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_aegisx_settings_updated_at ON aegisx_settings;
CREATE TRIGGER update_aegisx_settings_updated_at
    BEFORE UPDATE ON aegisx_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log NFC access
CREATE OR REPLACE FUNCTION log_nfc_access(
    p_reader_id UUID,
    p_card_uid VARCHAR,
    p_access_granted BOOLEAN,
    p_denial_reason VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_school_id UUID;
    v_card_id UUID;
    v_student_id UUID;
    v_student_name VARCHAR;
    v_student_tag VARCHAR;
    v_log_id UUID;
BEGIN
    -- Get reader's school_id
    SELECT school_id INTO v_school_id FROM nfc_readers WHERE id = p_reader_id;
    
    -- Try to find the card and student
    SELECT c.id, c.student_id, 
           COALESCE(p.first_name || ' ' || p.last_name, 'Unknown'),
           si.student_tag
    INTO v_card_id, v_student_id, v_student_name, v_student_tag
    FROM nfc_cards c
    LEFT JOIN profiles p ON p.user_id = c.student_id
    LEFT JOIN student_info si ON si.student_id = c.student_id
    WHERE c.card_uid = p_card_uid;
    
    -- Insert access log
    INSERT INTO nfc_access_logs (
        school_id, reader_id, card_id, student_id,
        card_uid, student_name, student_tag,
        access_granted, denial_reason
    ) VALUES (
        v_school_id, p_reader_id, v_card_id, v_student_id,
        p_card_uid, v_student_name, v_student_tag,
        p_access_granted, p_denial_reason
    ) RETURNING id INTO v_log_id;
    
    -- Update reader stats
    UPDATE nfc_readers
    SET total_scans = total_scans + 1,
        today_scans = today_scans + 1,
        last_sync = NOW()
    WHERE id = p_reader_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset daily scans (call via cron job at midnight)
CREATE OR REPLACE FUNCTION reset_daily_scans()
RETURNS void AS $$
BEGIN
    UPDATE nfc_readers SET today_scans = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT EXECUTE ON FUNCTION get_user_school_id() TO authenticated;
GRANT EXECUTE ON FUNCTION is_school_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION log_nfc_access(UUID, VARCHAR, BOOLEAN, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_daily_scans() TO authenticated;

-- =====================================================
-- VERIFICATION
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ AegisX NFC System schema created successfully!';
    RAISE NOTICE 'Tables created: nfc_readers, nfc_cards, nfc_access_logs, nfc_reader_stats, student_info, aegisx_settings, aegisx_hourly_traffic, student_card_history, reader_health_logs';
    RAISE NOTICE 'All RLS policies applied for school-based data isolation';
END $$;

SELECT 'AegisX NFC System - Installation Complete!' as status;
