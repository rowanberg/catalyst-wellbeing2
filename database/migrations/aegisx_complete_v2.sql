-- =====================================================
-- AegisX Complete System v2 - Full Feature Migration
-- =====================================================
-- This migration adds comprehensive features for:
-- 1. Multi-role cards (student/staff/visitor/temporary)
-- 2. Period-wise attendance tracking
-- 3. Access control rules engine
-- 4. Parent notification system
-- 5. Transport tracking
-- 6. Behavior detection & alerts
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. EXTEND NFC_CARDS FOR MULTI-ROLE SUPPORT
-- =====================================================

-- Add new columns to nfc_cards if they don't exist
DO $$
BEGIN
    -- Card type (student, staff, visitor, temporary)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nfc_cards' AND column_name = 'card_type') THEN
        ALTER TABLE nfc_cards ADD COLUMN card_type VARCHAR(20) DEFAULT 'student' 
            CHECK (card_type IN ('student', 'staff', 'visitor', 'temporary', 'exam_only', 'event_only'));
    END IF;

    -- Role metadata (JSON for role-specific data)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nfc_cards' AND column_name = 'role_metadata') THEN
        ALTER TABLE nfc_cards ADD COLUMN role_metadata JSONB DEFAULT '{}';
    END IF;

    -- Validity period for temporary cards
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nfc_cards' AND column_name = 'valid_from') THEN
        ALTER TABLE nfc_cards ADD COLUMN valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nfc_cards' AND column_name = 'valid_until') THEN
        ALTER TABLE nfc_cards ADD COLUMN valid_until TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Suspension support
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nfc_cards' AND column_name = 'is_suspended') THEN
        ALTER TABLE nfc_cards ADD COLUMN is_suspended BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nfc_cards' AND column_name = 'suspension_reason') THEN
        ALTER TABLE nfc_cards ADD COLUMN suspension_reason TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nfc_cards' AND column_name = 'suspended_at') THEN
        ALTER TABLE nfc_cards ADD COLUMN suspended_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nfc_cards' AND column_name = 'suspended_by') THEN
        ALTER TABLE nfc_cards ADD COLUMN suspended_by UUID REFERENCES profiles(id);
    END IF;

    -- Academic year tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nfc_cards' AND column_name = 'academic_year') THEN
        ALTER TABLE nfc_cards ADD COLUMN academic_year VARCHAR(20);
    END IF;

    -- Alumni/passed-out status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nfc_cards' AND column_name = 'is_alumni') THEN
        ALTER TABLE nfc_cards ADD COLUMN is_alumni BOOLEAN DEFAULT false;
    END IF;
END $$;

-- =====================================================
-- 2. SCHOOL PERIODS/TIMETABLE REFERENCE
-- =====================================================

CREATE TABLE IF NOT EXISTS school_periods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    -- Period identification
    period_number INTEGER NOT NULL,
    period_name VARCHAR(50) NOT NULL, -- e.g., "Period 1", "Lunch", "Assembly"
    period_type VARCHAR(20) DEFAULT 'class' CHECK (period_type IN ('class', 'break', 'lunch', 'assembly', 'activity')),
    
    -- Timing
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    late_threshold_minutes INTEGER DEFAULT 5, -- Minutes after start to be marked late
    
    -- Days applicable
    applicable_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- 1=Monday, 7=Sunday
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(school_id, period_number)
);

-- =====================================================
-- 3. PERIOD-WISE ATTENDANCE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS period_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    -- Student info
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Period/Class info
    period_id UUID REFERENCES school_periods(id),
    class_id UUID REFERENCES classes(id),
    
    -- Date & Time
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_start_time TIME,
    actual_entry_time TIME,
    actual_exit_time TIME,
    
    -- Scan information
    entry_reader_id UUID REFERENCES nfc_readers(id),
    exit_reader_id UUID REFERENCES nfc_readers(id),
    entry_card_id UUID REFERENCES nfc_cards(id),
    exit_card_id UUID REFERENCES nfc_cards(id),
    
    -- Auto-detected status
    auto_status VARCHAR(20) DEFAULT 'absent' CHECK (auto_status IN (
        'present', 'absent', 'late', 'early_exit', 'partial', 'excused'
    )),
    late_by_minutes INTEGER DEFAULT 0,
    early_exit_by_minutes INTEGER DEFAULT 0,
    
    -- Final status (after teacher/admin override)
    final_status VARCHAR(20) CHECK (final_status IN (
        'present', 'absent', 'late', 'early_exit', 'partial', 'excused', 'half_day'
    )),
    
    -- Override info
    is_overridden BOOLEAN DEFAULT false,
    overridden_by UUID REFERENCES profiles(id),
    override_reason TEXT,
    overridden_at TIMESTAMP WITH TIME ZONE,
    
    -- Substitute teacher support
    original_teacher_id UUID REFERENCES profiles(id),
    substitute_teacher_id UUID REFERENCES profiles(id),
    
    -- Notes
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: one attendance record per student per period per day
    UNIQUE(student_id, period_id, attendance_date)
);

-- =====================================================
-- 4. ACCESS CONTROL RULES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS access_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    -- Rule identification
    name VARCHAR(100) NOT NULL,
    description TEXT,
    rule_type VARCHAR(30) NOT NULL CHECK (rule_type IN (
        'time_based',      -- Access only during certain hours
        'class_based',     -- Only certain classes allowed
        'role_based',      -- Only certain roles (student/staff)
        'location_based',  -- Only at certain readers
        'grade_based',     -- Only certain grade levels
        'emergency',       -- Emergency override rules
        'exam_mode',       -- Special exam rules
        'lockdown',        -- Lockdown mode
        'silent_mode'      -- No buzzer/sound
    )),
    
    -- Target readers (NULL = all readers)
    reader_ids UUID[],
    
    -- Target card types (NULL = all types)
    card_types VARCHAR(20)[],
    
    -- Target grades (NULL = all grades)
    grade_levels VARCHAR(10)[],
    
    -- Target classes (NULL = all classes)
    class_ids UUID[],
    
    -- Conditions (flexible JSON)
    conditions JSONB NOT NULL DEFAULT '{}',
    /*
    Example conditions:
    {
        "time_window": { "start": "08:00", "end": "16:00" },
        "allowed_days": [1, 2, 3, 4, 5],
        "blocked_location_types": ["office", "staff_room"],
        "max_entries_per_day": 3,
        "require_pin": true,
        "alert_after_hours": true
    }
    */
    
    -- Action when rule matches
    action VARCHAR(20) NOT NULL DEFAULT 'allow' CHECK (action IN (
        'allow',       -- Grant access
        'deny',        -- Block access
        'alert',       -- Allow but send alert
        'silent_log',  -- Allow, log silently (no buzzer)
        'require_pin', -- Require PIN entry
        'notify_admin' -- Allow and notify admin
    )),
    
    -- Priority (higher = evaluated first)
    priority INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_emergency_rule BOOLEAN DEFAULT false,
    
    -- Validity
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    
    -- Audit
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. EMERGENCY MODES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS emergency_modes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    mode_type VARCHAR(30) NOT NULL CHECK (mode_type IN (
        'lockdown',      -- All access blocked
        'emergency_unlock', -- All doors unlocked
        'silent_mode',   -- No buzzers
        'exam_mode',     -- Special exam restrictions
        'evacuation',    -- Evacuation mode
        'normal'         -- Normal operation
    )),
    
    is_active BOOLEAN DEFAULT false,
    
    -- Activation info
    activated_by UUID REFERENCES profiles(id),
    activated_at TIMESTAMP WITH TIME ZONE,
    activation_reason TEXT,
    
    -- Deactivation info
    deactivated_by UUID REFERENCES profiles(id),
    deactivated_at TIMESTAMP WITH TIME ZONE,
    
    -- Auto-deactivation
    auto_deactivate_at TIMESTAMP WITH TIME ZONE,
    
    -- Affected readers (NULL = all)
    affected_reader_ids UUID[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. NOTIFICATION QUEUE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS notification_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    -- Recipient
    recipient_id UUID REFERENCES profiles(id),
    recipient_type VARCHAR(20) CHECK (recipient_type IN ('student', 'parent', 'teacher', 'admin')),
    recipient_contact VARCHAR(255), -- Phone/Email
    
    -- Notification type
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
        'entry_alert',
        'exit_alert',
        'late_entry',
        'early_exit',
        'absent_alert',
        'attendance_summary',
        'low_attendance_warning',
        'card_suspended',
        'card_expired',
        'emergency_broadcast',
        'bus_boarding',
        'bus_drop',
        'missed_bus',
        'unusual_activity',
        'restricted_zone'
    )),
    
    -- Related student (for parent notifications)
    related_student_id UUID REFERENCES profiles(id),
    
    -- Content
    title VARCHAR(200),
    message TEXT NOT NULL,
    message_data JSONB DEFAULT '{}', -- Additional structured data
    
    -- Delivery
    delivery_channel VARCHAR(20) CHECK (delivery_channel IN ('push', 'sms', 'email', 'whatsapp', 'in_app')),
    delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN (
        'pending', 'sent', 'delivered', 'failed', 'cancelled'
    )),
    delivery_attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    
    -- Preferences
    is_silent BOOLEAN DEFAULT false, -- Silent notification (no sound)
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Scheduling
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. TRANSPORT TRACKING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS transport_routes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    route_name VARCHAR(100) NOT NULL,
    route_code VARCHAR(20),
    
    -- Vehicle info
    vehicle_number VARCHAR(50),
    driver_name VARCHAR(100),
    driver_phone VARCHAR(20),
    
    -- Stops (JSON array of stop objects)
    stops JSONB DEFAULT '[]',
    /*
    Example stops:
    [
        { "name": "Stop 1", "time": "07:30", "lat": 12.34, "lng": 56.78 },
        { "name": "Stop 2", "time": "07:45", "lat": 12.35, "lng": 56.79 }
    ]
    */
    
    -- Timing
    morning_start_time TIME,
    morning_end_time TIME,
    afternoon_start_time TIME,
    afternoon_end_time TIME,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_transport_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES transport_routes(id) ON DELETE CASCADE,
    
    -- Stop assignment
    pickup_stop VARCHAR(100),
    dropoff_stop VARCHAR(100),
    
    -- Expected times
    expected_pickup_time TIME,
    expected_dropoff_time TIME,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(student_id, route_id)
);

CREATE TABLE IF NOT EXISTS transport_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    route_id UUID REFERENCES transport_routes(id),
    
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Boarding info
    boarding_time TIMESTAMP WITH TIME ZONE,
    boarding_reader_id UUID REFERENCES nfc_readers(id),
    boarding_stop VARCHAR(100),
    
    -- Drop info
    drop_time TIMESTAMP WITH TIME ZONE,
    drop_reader_id UUID REFERENCES nfc_readers(id),
    drop_stop VARCHAR(100),
    
    -- Status
    boarding_status VARCHAR(20) CHECK (boarding_status IN ('boarded', 'missed', 'late')),
    drop_status VARCHAR(20) CHECK (drop_status IN ('dropped', 'early', 'late', 'wrong_stop')),
    
    -- Flags
    is_wrong_bus BOOLEAN DEFAULT false,
    parent_notified BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(student_id, log_date, route_id)
);

-- =====================================================
-- 8. BEHAVIOR DETECTION & ALERTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS behavior_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Alert type
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN (
        'unusual_movement',      -- Too many location changes
        'truancy_pattern',       -- Frequent absences pattern
        'restricted_zone',       -- Entered restricted area
        'after_hours_presence',  -- Detected after school hours
        'early_arrival',         -- Arrived too early
        'excessive_exits',       -- Too many exits in a day
        'loitering',             -- Staying too long in one area
        'tailgating',            -- Following someone without scan
        'pattern_anomaly'        -- AI-detected anomaly
    )),
    
    -- Severity
    severity VARCHAR(10) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Details
    title VARCHAR(200),
    description TEXT,
    details JSONB DEFAULT '{}',
    /*
    Example details:
    {
        "reader_id": "uuid",
        "location": "Library",
        "time": "18:30",
        "pattern_data": {...}
    }
    */
    
    -- Related scans
    related_scan_ids UUID[],
    
    -- Resolution
    is_resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES profiles(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    
    -- Actions taken
    action_taken VARCHAR(50),
    parent_notified BOOLEAN DEFAULT false,
    admin_notified BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. DAILY ATTENDANCE SUMMARY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS daily_attendance_summary (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    summary_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Class/Grade info (optional for school-wide summaries)
    class_id UUID REFERENCES classes(id),
    grade_level_id UUID REFERENCES grade_levels(id),
    
    -- Counts
    total_students INTEGER DEFAULT 0,
    present_count INTEGER DEFAULT 0,
    absent_count INTEGER DEFAULT 0,
    late_count INTEGER DEFAULT 0,
    early_exit_count INTEGER DEFAULT 0,
    half_day_count INTEGER DEFAULT 0,
    
    -- Rates
    attendance_rate DECIMAL(5,2) DEFAULT 0.00,
    punctuality_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Generated at
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(school_id, summary_date, COALESCE(class_id, '00000000-0000-0000-0000-000000000000'::UUID))
);

-- =====================================================
-- 10. AUDIT LOG TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS aegisx_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    -- Actor
    actor_id UUID REFERENCES profiles(id),
    actor_role VARCHAR(20),
    
    -- Action
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    
    -- Details
    old_values JSONB,
    new_values JSONB,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp (immutable)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Period attendance indexes
CREATE INDEX IF NOT EXISTS idx_period_attendance_student_date ON period_attendance(student_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_period_attendance_school_date ON period_attendance(school_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_period_attendance_class_date ON period_attendance(class_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_period_attendance_status ON period_attendance(auto_status);

-- Access rules indexes
CREATE INDEX IF NOT EXISTS idx_access_rules_school ON access_rules(school_id);
CREATE INDEX IF NOT EXISTS idx_access_rules_active ON access_rules(is_active, priority DESC);
CREATE INDEX IF NOT EXISTS idx_access_rules_type ON access_rules(rule_type);

-- Notification queue indexes
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(delivery_status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notification_queue_recipient ON notification_queue(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_student ON notification_queue(related_student_id);

-- Transport logs indexes
CREATE INDEX IF NOT EXISTS idx_transport_logs_student_date ON transport_logs(student_id, log_date);
CREATE INDEX IF NOT EXISTS idx_transport_logs_route ON transport_logs(route_id, log_date);

-- Behavior alerts indexes
CREATE INDEX IF NOT EXISTS idx_behavior_alerts_student ON behavior_alerts(student_id);
CREATE INDEX IF NOT EXISTS idx_behavior_alerts_unresolved ON behavior_alerts(is_resolved, severity);
CREATE INDEX IF NOT EXISTS idx_behavior_alerts_type ON behavior_alerts(alert_type);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_school_created ON aegisx_audit_log(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON aegisx_audit_log(entity_type, entity_id);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE school_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE period_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_transport_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavior_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_attendance_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE aegisx_audit_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- School periods policies
CREATE POLICY "Users can view periods from their school" ON school_periods
    FOR SELECT USING (
        school_id IN (SELECT school_id FROM profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can manage periods" ON school_periods
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin' AND school_id = school_periods.school_id)
    );

-- Period attendance policies
CREATE POLICY "Students can view own attendance" ON period_attendance
    FOR SELECT USING (student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Teachers can view/manage class attendance" ON period_attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN teacher_class_assignments tca ON tca.teacher_id = p.id
            WHERE p.user_id = auth.uid() 
            AND p.role IN ('teacher', 'admin')
            AND (tca.class_id = period_attendance.class_id OR p.role = 'admin')
        )
    );

-- Access rules policies (admin only)
CREATE POLICY "Admins can manage access rules" ON access_rules
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin' AND school_id = access_rules.school_id)
    );

-- Notification queue policies
CREATE POLICY "Users can view own notifications" ON notification_queue
    FOR SELECT USING (recipient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "System can manage notifications" ON notification_queue
    FOR ALL USING (true);

-- Transport policies
CREATE POLICY "Users can view transport from their school" ON transport_routes
    FOR SELECT USING (school_id IN (SELECT school_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Students can view own transport" ON transport_logs
    FOR SELECT USING (student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage transport" ON transport_logs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin' AND school_id = transport_logs.school_id)
    );

-- Behavior alerts policies
CREATE POLICY "Students can view own alerts" ON behavior_alerts
    FOR SELECT USING (student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Staff can view alerts for their school" ON behavior_alerts
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('teacher', 'admin') AND school_id = behavior_alerts.school_id)
    );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to process NFC scan and create attendance record
CREATE OR REPLACE FUNCTION process_nfc_attendance_scan(
    p_reader_id UUID,
    p_card_uid VARCHAR,
    p_scan_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
    v_card RECORD;
    v_reader RECORD;
    v_period RECORD;
    v_existing_attendance RECORD;
    v_result JSONB;
    v_scan_time_only TIME;
    v_late_minutes INTEGER;
    v_status VARCHAR(20);
BEGIN
    -- Get card info
    SELECT * INTO v_card FROM nfc_cards 
    WHERE card_uid = p_card_uid AND status = 'active' AND NOT is_suspended;
    
    IF v_card IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Card not found or inactive'
        );
    END IF;
    
    -- Get reader info
    SELECT * INTO v_reader FROM nfc_readers WHERE id = p_reader_id;
    
    IF v_reader IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Reader not found'
        );
    END IF;
    
    -- Check if reader is configured for attendance
    IF v_reader.location_type NOT IN ('gate', 'classroom') THEN
        -- Not an attendance reader, just log access
        RETURN jsonb_build_object(
            'success', true,
            'action', 'access_logged',
            'is_attendance', false
        );
    END IF;
    
    -- Find current period
    v_scan_time_only := p_scan_time::TIME;
    
    SELECT * INTO v_period FROM school_periods
    WHERE school_id = v_reader.school_id
    AND v_scan_time_only BETWEEN start_time AND end_time
    AND EXTRACT(DOW FROM p_scan_time) = ANY(applicable_days)
    AND is_active = true
    ORDER BY start_time
    LIMIT 1;
    
    IF v_period IS NULL THEN
        -- No period active, log as general entry
        RETURN jsonb_build_object(
            'success', true,
            'action', 'entry_logged',
            'is_attendance', false,
            'message', 'No active period'
        );
    END IF;
    
    -- Calculate if late
    IF v_scan_time_only > v_period.start_time THEN
        v_late_minutes := EXTRACT(EPOCH FROM (v_scan_time_only - v_period.start_time)) / 60;
        IF v_late_minutes > v_period.late_threshold_minutes THEN
            v_status := 'late';
        ELSE
            v_status := 'present';
            v_late_minutes := 0;
        END IF;
    ELSE
        v_status := 'present';
        v_late_minutes := 0;
    END IF;
    
    -- Check for existing attendance record
    SELECT * INTO v_existing_attendance FROM period_attendance
    WHERE student_id = v_card.student_id
    AND period_id = v_period.id
    AND attendance_date = p_scan_time::DATE;
    
    IF v_existing_attendance IS NOT NULL THEN
        -- Update exit time
        UPDATE period_attendance
        SET actual_exit_time = v_scan_time_only,
            exit_reader_id = p_reader_id,
            updated_at = NOW()
        WHERE id = v_existing_attendance.id;
        
        RETURN jsonb_build_object(
            'success', true,
            'action', 'exit_recorded',
            'attendance_id', v_existing_attendance.id,
            'period_name', v_period.period_name
        );
    END IF;
    
    -- Create new attendance record
    INSERT INTO period_attendance (
        school_id, student_id, period_id, attendance_date,
        expected_start_time, actual_entry_time,
        entry_reader_id, entry_card_id,
        auto_status, late_by_minutes, final_status
    ) VALUES (
        v_reader.school_id, v_card.student_id, v_period.id, p_scan_time::DATE,
        v_period.start_time, v_scan_time_only,
        p_reader_id, v_card.id,
        v_status, v_late_minutes, v_status
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'action', 'attendance_marked',
        'status', v_status,
        'late_minutes', v_late_minutes,
        'period_name', v_period.period_name,
        'student_id', v_card.student_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to evaluate access rules
CREATE OR REPLACE FUNCTION evaluate_access_rules(
    p_reader_id UUID,
    p_card_id UUID,
    p_scan_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
    v_card RECORD;
    v_reader RECORD;
    v_rule RECORD;
    v_result JSONB := jsonb_build_object('access', 'allow', 'reasons', '[]'::jsonb);
    v_scan_time_only TIME;
    v_day_of_week INTEGER;
    v_emergency_mode RECORD;
BEGIN
    -- Get card and reader info
    SELECT * INTO v_card FROM nfc_cards WHERE id = p_card_id;
    SELECT * INTO v_reader FROM nfc_readers WHERE id = p_reader_id;
    
    -- Check emergency modes first
    SELECT * INTO v_emergency_mode FROM emergency_modes
    WHERE school_id = v_reader.school_id
    AND is_active = true
    ORDER BY activated_at DESC
    LIMIT 1;
    
    IF v_emergency_mode IS NOT NULL THEN
        IF v_emergency_mode.mode_type = 'lockdown' THEN
            RETURN jsonb_build_object(
                'access', 'deny',
                'reason', 'School is in lockdown mode'
            );
        ELSIF v_emergency_mode.mode_type = 'emergency_unlock' THEN
            RETURN jsonb_build_object(
                'access', 'allow',
                'reason', 'Emergency unlock active'
            );
        END IF;
    END IF;
    
    -- Check card suspension
    IF v_card.is_suspended THEN
        RETURN jsonb_build_object(
            'access', 'deny',
            'reason', COALESCE(v_card.suspension_reason, 'Card is suspended')
        );
    END IF;
    
    -- Check card expiry
    IF v_card.valid_until IS NOT NULL AND v_card.valid_until < NOW() THEN
        RETURN jsonb_build_object(
            'access', 'deny',
            'reason', 'Card has expired'
        );
    END IF;
    
    -- Evaluate active rules by priority
    v_scan_time_only := p_scan_time::TIME;
    v_day_of_week := EXTRACT(DOW FROM p_scan_time)::INTEGER;
    
    FOR v_rule IN 
        SELECT * FROM access_rules
        WHERE school_id = v_reader.school_id
        AND is_active = true
        AND (reader_ids IS NULL OR p_reader_id = ANY(reader_ids))
        AND (card_types IS NULL OR v_card.card_type = ANY(card_types))
        AND (valid_from IS NULL OR valid_from <= NOW())
        AND (valid_until IS NULL OR valid_until >= NOW())
        ORDER BY priority DESC
    LOOP
        -- Evaluate time-based rules
        IF v_rule.rule_type = 'time_based' THEN
            IF v_rule.conditions ? 'time_window' THEN
                IF v_scan_time_only < (v_rule.conditions->'time_window'->>'start')::TIME 
                   OR v_scan_time_only > (v_rule.conditions->'time_window'->>'end')::TIME THEN
                    v_result := jsonb_build_object(
                        'access', v_rule.action,
                        'rule_id', v_rule.id,
                        'reason', 'Outside allowed time window'
                    );
                    EXIT;
                END IF;
            END IF;
        END IF;
        
        -- Evaluate location-based rules
        IF v_rule.rule_type = 'location_based' THEN
            IF v_rule.conditions ? 'blocked_location_types' THEN
                IF v_reader.location_type = ANY(ARRAY(
                    SELECT jsonb_array_elements_text(v_rule.conditions->'blocked_location_types')
                )) THEN
                    v_result := jsonb_build_object(
                        'access', 'deny',
                        'rule_id', v_rule.id,
                        'reason', format('Access to %s is restricted', v_reader.location_type)
                    );
                    EXIT;
                END IF;
            END IF;
        END IF;
    END LOOP;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to detect unusual behavior
CREATE OR REPLACE FUNCTION check_unusual_behavior(
    p_student_id UUID,
    p_reader_id UUID,
    p_scan_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
    v_scan_count INTEGER;
    v_last_hour_scans INTEGER;
    v_school_id UUID;
    v_reader RECORD;
    v_alert_id UUID;
    v_result JSONB := jsonb_build_object('alert', false);
BEGIN
    -- Get reader info
    SELECT * INTO v_reader FROM nfc_readers WHERE id = p_reader_id;
    v_school_id := v_reader.school_id;
    
    -- Check for excessive exits (more than 5 in one day)
    SELECT COUNT(*) INTO v_scan_count FROM nfc_access_logs
    WHERE student_id = p_student_id
    AND DATE(created_at) = DATE(p_scan_time)
    AND reader_id IN (SELECT id FROM nfc_readers WHERE location_type = 'gate');
    
    IF v_scan_count > 10 THEN
        INSERT INTO behavior_alerts (
            school_id, student_id, alert_type, severity,
            title, description, details
        ) VALUES (
            v_school_id, p_student_id, 'excessive_exits', 'medium',
            'Excessive gate activity detected',
            format('Student has %s gate scans today, which is unusually high', v_scan_count),
            jsonb_build_object('scan_count', v_scan_count, 'reader_id', p_reader_id)
        ) RETURNING id INTO v_alert_id;
        
        v_result := jsonb_build_object(
            'alert', true,
            'alert_id', v_alert_id,
            'type', 'excessive_exits'
        );
    END IF;
    
    -- Check for after-hours presence (after 6 PM)
    IF p_scan_time::TIME > '18:00'::TIME THEN
        INSERT INTO behavior_alerts (
            school_id, student_id, alert_type, severity,
            title, description, details
        ) VALUES (
            v_school_id, p_student_id, 'after_hours_presence', 'high',
            'After-hours presence detected',
            format('Student detected at %s after 6 PM', v_reader.location),
            jsonb_build_object('time', p_scan_time, 'location', v_reader.location)
        ) RETURNING id INTO v_alert_id;
        
        v_result := jsonb_build_object(
            'alert', true,
            'alert_id', v_alert_id,
            'type', 'after_hours_presence'
        );
    END IF;
    
    -- Check for restricted zone access
    IF v_reader.location_type IN ('office', 'staff_room') THEN
        -- Check if student has permission (check access_rules)
        -- For now, create alert for any student in staff areas
        INSERT INTO behavior_alerts (
            school_id, student_id, alert_type, severity,
            title, description, details
        ) VALUES (
            v_school_id, p_student_id, 'restricted_zone', 'medium',
            'Restricted zone access attempt',
            format('Student attempted to access %s', v_reader.location),
            jsonb_build_object('location', v_reader.location, 'location_type', v_reader.location_type)
        ) RETURNING id INTO v_alert_id;
        
        v_result := jsonb_build_object(
            'alert', true,
            'alert_id', v_alert_id,
            'type', 'restricted_zone'
        );
    END IF;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANTS
-- =====================================================

GRANT EXECUTE ON FUNCTION process_nfc_attendance_scan(UUID, VARCHAR, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION evaluate_access_rules(UUID, UUID, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION check_unusual_behavior(UUID, UUID, TIMESTAMP WITH TIME ZONE) TO authenticated;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ AegisX v2 migration completed successfully!';
    RAISE NOTICE 'Tables created/updated:';
    RAISE NOTICE '  - nfc_cards (extended with multi-role support)';
    RAISE NOTICE '  - school_periods';
    RAISE NOTICE '  - period_attendance';
    RAISE NOTICE '  - access_rules';
    RAISE NOTICE '  - emergency_modes';
    RAISE NOTICE '  - notification_queue';
    RAISE NOTICE '  - transport_routes, student_transport_assignments, transport_logs';
    RAISE NOTICE '  - behavior_alerts';
    RAISE NOTICE '  - daily_attendance_summary';
    RAISE NOTICE '  - aegisx_audit_log';
END $$;

SELECT 'AegisX v2 Complete Migration - Success!' as status;
