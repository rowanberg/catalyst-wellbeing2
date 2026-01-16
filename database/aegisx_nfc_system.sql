-- =====================================================
-- AegisX NFC Access Control System - Complete Schema
-- =====================================================
-- This SQL file creates all necessary tables, functions, and policies
-- for the AegisX NFC access control and digital ID system
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. NFC READERS TABLE
-- =====================================================
-- Stores information about physical NFC reader devices deployed across campus
CREATE TABLE IF NOT EXISTS nfc_readers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    -- Reader identification
    name VARCHAR(255) NOT NULL,
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    
    -- Location details
    location VARCHAR(255) NOT NULL, -- e.g., "Building A, Ground Floor"
    location_type VARCHAR(50) NOT NULL CHECK (location_type IN ('library', 'canteen', 'gate', 'lab', 'classroom', 'office', 'gym', 'other')),
    
    -- Status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline', 'maintenance')),
    last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Statistics
    total_scans INTEGER DEFAULT 0,
    today_scans INTEGER DEFAULT 0,
    
    -- Configuration
    enabled BOOLEAN DEFAULT true,
    auto_grant_access BOOLEAN DEFAULT true, -- Whether to automatically grant access to linked cards
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- 2. NFC CARDS TABLE
-- =====================================================
-- Stores information about physical NFC cards linked to student profiles
CREATE TABLE IF NOT EXISTS nfc_cards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    -- Card identification
    card_uid VARCHAR(100) UNIQUE NOT NULL, -- Physical NFC card UID
    card_number VARCHAR(50), -- Optional printed card number
    
    -- Linked student
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Card status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'lost', 'stolen', 'expired')),
    linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- Card expiration date
    
    -- Security
    pin_hash VARCHAR(255), -- Optional PIN for card (hashed)
    failed_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(student_id) -- One card per student
);

-- =====================================================
-- 3. NFC ACCESS LOGS TABLE
-- =====================================================
-- Records every NFC card scan/access attempt
CREATE TABLE IF NOT EXISTS nfc_access_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    -- Reader and card info
    reader_id UUID NOT NULL REFERENCES nfc_readers(id) ON DELETE CASCADE,
    card_id UUID REFERENCES nfc_cards(id) ON DELETE SET NULL, -- Can be NULL if card not found
    card_uid VARCHAR(100), -- Store UID even if card not in system
    
    -- Student info (denormalized for faster queries)
    student_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    student_name VARCHAR(255),
    student_tag VARCHAR(12),
    
    -- Access details
    access_granted BOOLEAN NOT NULL,
    denial_reason VARCHAR(255), -- If denied, why? (e.g., "Card expired", "Card not found", "Reader offline")
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. STUDENT INFORMATION TABLE (Extended Profile Data)
-- =====================================================
-- Stores additional student information for digital ID cards
CREATE TABLE IF NOT EXISTS student_info (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    -- Personal Information (encrypted sensitive data)
    date_of_birth DATE,
    blood_group VARCHAR(5),
    gender VARCHAR(20),
    
    -- Contact Information
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    
    -- Emergency Contact
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relation VARCHAR(50),
    
    -- Academic Information
    grade_level VARCHAR(10),
    class_name VARCHAR(50),
    section VARCHAR(10),
    roll_number VARCHAR(20),
    admission_date DATE,
    
    -- Physical Description (for ID card)
    profile_picture_url TEXT,
    avatar_url TEXT,
    
    -- Medical Information (encrypted)
    medical_conditions TEXT, -- ENCRYPTED: Allergies, chronic conditions, etc.
    medications TEXT, -- ENCRYPTED: Current medications
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. READER STATISTICS TABLE (Daily aggregations)
-- =====================================================
-- Daily statistics per reader for historical tracking
CREATE TABLE IF NOT EXISTS nfc_reader_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reader_id UUID NOT NULL REFERENCES nfc_readers(id) ON DELETE CASCADE,
    
    -- Date
    stat_date DATE NOT NULL,
    
    -- Statistics
    total_scans INTEGER DEFAULT 0,
    successful_scans INTEGER DEFAULT 0,
    failed_scans INTEGER DEFAULT 0,
    unique_students INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(reader_id, stat_date)
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================

-- NFC Readers indexes
CREATE INDEX IF NOT EXISTS idx_nfc_readers_school ON nfc_readers(school_id);
CREATE INDEX IF NOT EXISTS idx_nfc_readers_status ON nfc_readers(status);
CREATE INDEX IF NOT EXISTS idx_nfc_readers_location_type ON nfc_readers(location_type);
CREATE INDEX IF NOT EXISTS idx_nfc_readers_serial ON nfc_readers(serial_number);

-- NFC Cards indexes
CREATE INDEX IF NOT EXISTS idx_nfc_cards_school ON nfc_cards(school_id);
CREATE INDEX IF NOT EXISTS idx_nfc_cards_student ON nfc_cards(student_id);
CREATE INDEX IF NOT EXISTS idx_nfc_cards_uid ON nfc_cards(card_uid);
CREATE INDEX IF NOT EXISTS idx_nfc_cards_status ON nfc_cards(status);

-- NFC Access Logs indexes
CREATE INDEX IF NOT EXISTS idx_nfc_access_logs_school ON nfc_access_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_nfc_access_logs_reader ON nfc_access_logs(reader_id);
CREATE INDEX IF NOT EXISTS idx_nfc_access_logs_card ON nfc_access_logs(card_id);
CREATE INDEX IF NOT EXISTS idx_nfc_access_logs_student ON nfc_access_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_nfc_access_logs_created ON nfc_access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nfc_access_logs_granted ON nfc_access_logs(access_granted);

-- Student Info indexes
CREATE INDEX IF NOT EXISTS idx_student_info_school ON student_info(school_id);
CREATE INDEX IF NOT EXISTS idx_student_info_student ON student_info(student_id);

-- Reader Stats indexes
CREATE INDEX IF NOT EXISTS idx_nfc_reader_stats_reader ON nfc_reader_stats(reader_id);
CREATE INDEX IF NOT EXISTS idx_nfc_reader_stats_date ON nfc_reader_stats(stat_date DESC);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to reset today_scans counter at midnight
CREATE OR REPLACE FUNCTION reset_reader_daily_scans()
RETURNS void AS $$
BEGIN
    UPDATE nfc_readers SET today_scans = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log NFC access
CREATE OR REPLACE FUNCTION log_nfc_access(
    p_reader_id UUID,
    p_card_uid VARCHAR,
    p_access_granted BOOLEAN,
    p_denial_reason VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_card_id UUID;
    v_student_id UUID;
    v_student_name VARCHAR(255);
    v_student_tag VARCHAR(12);
    v_school_id UUID;
    v_log_id UUID;
BEGIN
    -- Get reader school_id
    SELECT school_id INTO v_school_id FROM nfc_readers WHERE id = p_reader_id;
    
    -- Try to find the card
    SELECT id, student_id INTO v_card_id, v_student_id
    FROM nfc_cards
    WHERE card_uid = p_card_uid AND status = 'active';
    
    -- If card found, get student info
    IF v_student_id IS NOT NULL THEN
        SELECT 
            COALESCE(first_name || ' ' || last_name, 'Unknown'),
            student_tag
        INTO v_student_name, v_student_tag
        FROM profiles
        WHERE user_id = v_student_id;
    END IF;
    
    -- Insert access log
    INSERT INTO nfc_access_logs (
        school_id,
        reader_id,
        card_id,
        card_uid,
        student_id,
        student_name,
        student_tag,
        access_granted,
        denial_reason
    ) VALUES (
        v_school_id,
        p_reader_id,
        v_card_id,
        p_card_uid,
        v_student_id,
        v_student_name,
        v_student_tag,
        p_access_granted,
        p_denial_reason
    ) RETURNING id INTO v_log_id;
    
    -- Update reader stats
    UPDATE nfc_readers
    SET 
        total_scans = total_scans + 1,
        today_scans = today_scans + 1,
        last_sync = NOW()
    WHERE id = p_reader_id;
    
    -- Update daily stats
    INSERT INTO nfc_reader_stats (reader_id, stat_date, total_scans, successful_scans, failed_scans)
    VALUES (
        p_reader_id,
        CURRENT_DATE,
        1,
        CASE WHEN p_access_granted THEN 1 ELSE 0 END,
        CASE WHEN NOT p_access_granted THEN 1 ELSE 0 END
    )
    ON CONFLICT (reader_id, stat_date)
    DO UPDATE SET
        total_scans = nfc_reader_stats.total_scans + 1,
        successful_scans = nfc_reader_stats.successful_scans + CASE WHEN p_access_granted THEN 1 ELSE 0 END,
        failed_scans = nfc_reader_stats.failed_scans + CASE WHEN NOT p_access_granted THEN 1 ELSE 0 END;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get student NFC status
CREATE OR REPLACE FUNCTION get_student_nfc_status(p_student_id UUID)
RETURNS TABLE (
    is_linked BOOLEAN,
    card_id UUID,
    card_uid VARCHAR,
    linked_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR,
    total_scans BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id IS NOT NULL as is_linked,
        c.id,
        c.card_uid,
        c.linked_at,
        c.expires_at,
        c.status,
        COUNT(l.id) as total_scans
    FROM nfc_cards c
    LEFT JOIN nfc_access_logs l ON l.card_id = c.id
    WHERE c.student_id = p_student_id
    GROUP BY c.id, c.card_uid, c.linked_at, c.expires_at, c.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE nfc_readers ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfc_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfc_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfc_reader_stats ENABLE ROW LEVEL SECURITY;

-- NFC Readers Policies
DROP POLICY IF EXISTS "Admins can manage readers in their school" ON nfc_readers;
CREATE POLICY "Admins can manage readers in their school" ON nfc_readers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
            AND profiles.school_id = nfc_readers.school_id
        )
    );

DROP POLICY IF EXISTS "Students and teachers can view readers in their school" ON nfc_readers;
CREATE POLICY "Students and teachers can view readers in their school" ON nfc_readers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.school_id = nfc_readers.school_id
        )
    );

-- NFC Cards Policies
DROP POLICY IF EXISTS "Students can view own NFC card" ON nfc_cards;
CREATE POLICY "Students can view own NFC card" ON nfc_cards
    FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Admins can manage NFC cards in their school" ON nfc_cards;
CREATE POLICY "Admins can manage NFC cards in their school" ON nfc_cards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
            AND profiles.school_id = nfc_cards.school_id
        )
    );

-- NFC Access Logs Policies
DROP POLICY IF EXISTS "Students can view own access logs" ON nfc_access_logs;
CREATE POLICY "Students can view own access logs" ON nfc_access_logs
    FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Admins can view access logs in their school" ON nfc_access_logs;
CREATE POLICY "Admins can view access logs in their school" ON nfc_access_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
            AND profiles.school_id = nfc_access_logs.school_id
        )
    );

DROP POLICY IF EXISTS "System can insert access logs" ON nfc_access_logs;
CREATE POLICY "System can insert access logs" ON nfc_access_logs
    FOR INSERT WITH CHECK (true); -- Allow system to log all access attempts

-- Student Info Policies
DROP POLICY IF EXISTS "Students can view own info" ON student_info;
CREATE POLICY "Students can view own info" ON student_info
    FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can update own info" ON student_info;
CREATE POLICY "Students can update own info" ON student_info
    FOR UPDATE USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Admins can manage student info in their school" ON student_info;
CREATE POLICY "Admins can manage student info in their school" ON student_info
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
            AND profiles.school_id = student_info.school_id
        )
    );

-- Reader Stats Policies
DROP POLICY IF EXISTS "Admins can view reader stats in their school" ON nfc_reader_stats;
CREATE POLICY "Admins can view reader stats in their school" ON nfc_reader_stats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN nfc_readers r ON r.school_id = p.school_id
            WHERE p.user_id = auth.uid()
            AND p.role = 'admin'
            AND r.id = nfc_reader_stats.reader_id
        )
    );

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_nfc_readers_updated_at ON nfc_readers;
CREATE TRIGGER update_nfc_readers_updated_at
    BEFORE UPDATE ON nfc_readers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_nfc_cards_updated_at ON nfc_cards;
CREATE TRIGGER update_nfc_cards_updated_at
    BEFORE UPDATE ON nfc_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_info_updated_at ON student_info;
CREATE TRIGGER update_student_info_updated_at
    BEFORE UPDATE ON student_info
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION log_nfc_access(UUID, VARCHAR, BOOLEAN, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_nfc_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_reader_daily_scans() TO postgres;

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Uncomment below to insert sample data for testing
/*
-- Insert sample readers (replace with actual school_id)
INSERT INTO nfc_readers (school_id, name, serial_number, location, location_type, status)
VALUES 
    ('YOUR_SCHOOL_ID_HERE', 'Main Library Entrance', 'NFC-LIB-001', 'Building A, Ground Floor', 'library', 'online'),
    ('YOUR_SCHOOL_ID_HERE', 'Canteen Point A', 'NFC-CAN-001', 'Student Center', 'canteen', 'online'),
    ('YOUR_SCHOOL_ID_HERE', 'North Gate', 'NFC-GATE-001', 'Main Campus Entry', 'gate', 'online'),
    ('YOUR_SCHOOL_ID_HERE', 'Chemistry Lab', 'NFC-LAB-001', 'Science Block, Room 302', 'lab', 'online');
*/

-- =====================================================
-- END OF SCHEMA
-- =====================================================

-- To apply this schema:
-- 1. Run this SQL file in your Supabase SQL Editor
-- 2. Replace 'YOUR_SCHOOL_ID_HERE' in sample data with actual school IDs
-- 3. Verify all tables were created successfully
-- 4. Test RLS policies with different user roles

SELECT 'AegisX NFC System Schema created successfully!' as status;
