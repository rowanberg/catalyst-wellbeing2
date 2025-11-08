-- ============================================
-- SEATING CHART DATABASE SCHEMA
-- For Catalyst Education Platform
-- ============================================
-- This schema supports the drag & drop seating chart functionality
-- Including layout management, seat assignments, and history tracking
-- ============================================

-- DEPENDENCIES: This schema requires the following existing tables:
--   1. classes (id, school_id, grade_level_id, class_name, grade_level, section, subject, etc.)
--   2. profiles (id, first_name, last_name, email, role)
--   3. schools (id)
--   4. grade_levels (id)
--   5. xp_transactions (student_id, amount)
--   6. attendance (student_id, status, date)
--
-- Make sure these tables exist before running this schema.
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: seating_charts
-- Stores the overall seating chart configuration for each class
-- ============================================
CREATE TABLE IF NOT EXISTS seating_charts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Layout Configuration
    layout_template_id VARCHAR(100) NOT NULL, -- e.g., 'usa-traditional', 'india-government-large'
    layout_name VARCHAR(255) NOT NULL,
    rows INTEGER NOT NULL CHECK (rows > 0 AND rows <= 15),
    cols INTEGER NOT NULL CHECK (cols > 0 AND cols <= 15),
    total_seats INTEGER NOT NULL CHECK (total_seats > 0 AND total_seats <= 225),
    
    -- Layout Pattern (stored as JSON array)
    seat_pattern JSONB NOT NULL, -- e.g., ["seat", "seat", "empty", "seat", ...]
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    name VARCHAR(255), -- Optional custom name for this arrangement
    description TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    activated_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT valid_seat_pattern CHECK (jsonb_array_length(seat_pattern) = rows * cols)
);

-- Indexes for seating_charts
CREATE INDEX idx_seating_charts_class ON seating_charts(class_id);
CREATE INDEX idx_seating_charts_teacher ON seating_charts(teacher_id);
CREATE INDEX idx_seating_charts_active ON seating_charts(class_id, is_active) WHERE is_active = true;
CREATE INDEX idx_seating_charts_created ON seating_charts(created_at DESC);

-- Partial unique index to ensure only one active seating chart per class
CREATE UNIQUE INDEX unique_active_seating_per_class ON seating_charts(class_id) WHERE is_active = true;

-- ============================================
-- TABLE: seat_assignments
-- Stores individual student-to-seat mappings
-- ============================================
CREATE TABLE IF NOT EXISTS seat_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seating_chart_id UUID NOT NULL REFERENCES seating_charts(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Seat Information
    seat_id VARCHAR(10) NOT NULL, -- e.g., 'A1', 'B2', 'C3'
    row_index INTEGER NOT NULL CHECK (row_index >= 0),
    col_index INTEGER NOT NULL CHECK (col_index >= 0),
    
    -- Assignment Details
    assigned_by UUID REFERENCES profiles(id), -- Teacher who made the assignment
    assignment_method VARCHAR(50) DEFAULT 'manual', -- 'manual', 'ai_auto_arrange', 'imported'
    
    -- Student Context (denormalized for performance)
    student_name VARCHAR(255),
    student_xp INTEGER DEFAULT 0,
    student_attendance_rate DECIMAL(5,2),
    behavior_tag VARCHAR(50), -- 'top_performer', 'excellent', 'average', 'needs_focus'
    
    -- Timestamps
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_seat_per_chart UNIQUE (seating_chart_id, seat_id),
    CONSTRAINT unique_student_per_chart UNIQUE (seating_chart_id, student_id)
);

-- Indexes for seat_assignments
CREATE INDEX idx_seat_assignments_chart ON seat_assignments(seating_chart_id);
CREATE INDEX idx_seat_assignments_student ON seat_assignments(student_id);
CREATE INDEX idx_seat_assignments_seat ON seat_assignments(seating_chart_id, seat_id);

-- ============================================
-- TABLE: seating_chart_history
-- Tracks changes and versions of seating arrangements
-- ============================================
CREATE TABLE IF NOT EXISTS seating_chart_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seating_chart_id UUID NOT NULL REFERENCES seating_charts(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Snapshot Data
    version INTEGER NOT NULL,
    layout_template_id VARCHAR(100) NOT NULL,
    seat_pattern JSONB NOT NULL,
    assignments_snapshot JSONB, -- Full snapshot of all seat assignments at this version
    
    -- Change Information
    change_type VARCHAR(50) NOT NULL, -- 'created', 'updated', 'activated', 'deactivated', 'deleted'
    change_description TEXT,
    students_moved INTEGER DEFAULT 0,
    seats_filled INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_assignments_snapshot CHECK (assignments_snapshot IS NULL OR jsonb_typeof(assignments_snapshot) = 'array')
);

-- Indexes for seating_chart_history
CREATE INDEX idx_seating_history_chart ON seating_chart_history(seating_chart_id);
CREATE INDEX idx_seating_history_class ON seating_chart_history(class_id);
CREATE INDEX idx_seating_history_created ON seating_chart_history(created_at DESC);

-- ============================================
-- TABLE: seating_preferences
-- Stores teacher preferences and constraints for seating
-- ============================================
CREATE TABLE IF NOT EXISTS seating_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    
    -- Student Pairing Preferences
    student_id_1 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    student_id_2 UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Preference Type
    preference_type VARCHAR(50) NOT NULL, -- 'separate', 'together', 'near_front', 'near_back', 'near_teacher', 'avoid_distractions'
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10), -- 1=low, 10=high
    reason TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_student_pair CHECK (student_id_1 != student_id_2)
);

-- Indexes for seating_preferences
CREATE INDEX idx_seating_prefs_teacher ON seating_preferences(teacher_id);
CREATE INDEX idx_seating_prefs_class ON seating_preferences(class_id);
CREATE INDEX idx_seating_prefs_student1 ON seating_preferences(student_id_1);
CREATE INDEX idx_seating_prefs_active ON seating_preferences(is_active) WHERE is_active = true;

-- ============================================
-- TABLE: seating_analytics
-- Tracks performance metrics related to seating arrangements
-- ============================================
CREATE TABLE IF NOT EXISTS seating_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seating_chart_id UUID NOT NULL REFERENCES seating_charts(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    
    -- Analytics Period
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    days_active INTEGER NOT NULL CHECK (days_active >= 0),
    
    -- Performance Metrics
    avg_class_xp_change DECIMAL(10,2),
    avg_attendance_rate DECIMAL(5,2),
    behavior_incidents INTEGER DEFAULT 0,
    positive_interactions INTEGER DEFAULT 0,
    
    -- Student Engagement
    students_improved INTEGER DEFAULT 0,
    students_declined INTEGER DEFAULT 0,
    total_students INTEGER NOT NULL,
    
    -- Layout Effectiveness
    layout_rating DECIMAL(3,2) CHECK (layout_rating >= 0 AND layout_rating <= 5), -- 0-5 stars
    teacher_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_period CHECK (period_end > period_start)
);

-- Indexes for seating_analytics
CREATE INDEX idx_seating_analytics_chart ON seating_analytics(seating_chart_id);
CREATE INDEX idx_seating_analytics_class ON seating_analytics(class_id);
CREATE INDEX idx_seating_analytics_period ON seating_analytics(period_start, period_end);

-- ============================================
-- VIEWS
-- ============================================

-- View: Active Seating Charts with Details
CREATE OR REPLACE VIEW active_seating_charts AS
SELECT 
    sc.id,
    sc.class_id,
    sc.teacher_id,
    sc.layout_template_id,
    sc.layout_name,
    sc.rows,
    sc.cols,
    sc.total_seats,
    sc.seat_pattern,
    sc.version,
    sc.name,
    sc.description,
    c.class_name,
    c.grade_level,
    c.section,
    c.subject,
    c.room_number,
    c.class_code,
    c.academic_year,
    COUNT(sa.id) as seats_filled,
    (sc.total_seats - COUNT(sa.id)) as seats_empty,
    ROUND((COUNT(sa.id)::DECIMAL / sc.total_seats * 100), 2) as fill_percentage,
    sc.created_at,
    sc.updated_at,
    sc.activated_at
FROM seating_charts sc
LEFT JOIN classes c ON sc.class_id = c.id
LEFT JOIN seat_assignments sa ON sc.id = sa.seating_chart_id
WHERE sc.is_active = true
GROUP BY sc.id, c.class_name, c.grade_level, c.section, c.subject, c.room_number, c.class_code, c.academic_year;

-- View: Seat Assignments with Student Details
CREATE OR REPLACE VIEW seat_assignments_detailed AS
SELECT 
    sa.id,
    sa.seating_chart_id,
    sa.student_id,
    sa.seat_id,
    sa.row_index,
    sa.col_index,
    sa.assignment_method,
    sa.behavior_tag,
    p.first_name,
    p.last_name,
    p.email,
    sa.student_xp,
    sa.student_attendance_rate,
    sa.assigned_at,
    sa.updated_at,
    sc.class_id,
    sc.layout_template_id
FROM seat_assignments sa
JOIN profiles p ON sa.student_id = p.id
JOIN seating_charts sc ON sa.seating_chart_id = sc.id;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Update seating chart timestamp
CREATE OR REPLACE FUNCTION update_seating_chart_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Create seating history entry
CREATE OR REPLACE FUNCTION create_seating_history_entry()
RETURNS TRIGGER AS $$
DECLARE
    v_assignments_snapshot JSONB;
BEGIN
    -- Get current assignments as JSON
    SELECT jsonb_agg(jsonb_build_object(
        'student_id', student_id,
        'seat_id', seat_id,
        'row_index', row_index,
        'col_index', col_index,
        'student_name', student_name,
        'behavior_tag', behavior_tag
    ))
    INTO v_assignments_snapshot
    FROM seat_assignments
    WHERE seating_chart_id = NEW.id;
    
    -- Insert history record
    INSERT INTO seating_chart_history (
        seating_chart_id,
        class_id,
        teacher_id,
        version,
        layout_template_id,
        seat_pattern,
        assignments_snapshot,
        change_type,
        change_description,
        seats_filled
    )
    VALUES (
        NEW.id,
        NEW.class_id,
        NEW.teacher_id,
        NEW.version,
        NEW.layout_template_id,
        NEW.seat_pattern,
        v_assignments_snapshot,
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'created'
            WHEN TG_OP = 'UPDATE' AND NEW.is_active != OLD.is_active THEN 
                CASE WHEN NEW.is_active THEN 'activated' ELSE 'deactivated' END
            ELSE 'updated'
        END,
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'New seating chart created'
            WHEN TG_OP = 'UPDATE' THEN 'Seating chart updated'
        END,
        (SELECT COUNT(*) FROM seat_assignments WHERE seating_chart_id = NEW.id)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Update seat assignment denormalized data
CREATE OR REPLACE FUNCTION update_seat_assignment_student_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Update denormalized student data
    SELECT 
        CONCAT(p.first_name, ' ', p.last_name),
        COALESCE(SUM(xp.amount), 0),
        ROUND((COUNT(CASE WHEN a.status = 'present' THEN 1 END)::DECIMAL / NULLIF(COUNT(a.id), 0) * 100), 2)
    INTO 
        NEW.student_name,
        NEW.student_xp,
        NEW.student_attendance_rate
    FROM profiles p
    LEFT JOIN xp_transactions xp ON p.id = xp.student_id
    LEFT JOIN attendance a ON p.id = a.student_id 
        AND a.date >= CURRENT_DATE - INTERVAL '30 days'
    WHERE p.id = NEW.student_id
    GROUP BY p.first_name, p.last_name;
    
    -- Determine behavior tag based on XP
    NEW.behavior_tag := CASE 
        WHEN NEW.student_xp > 2500 THEN 'top_performer'
        WHEN NEW.student_xp > 2000 THEN 'excellent'
        WHEN NEW.student_xp < 1500 THEN 'needs_focus'
        ELSE 'average'
    END;
    
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Update seating chart timestamp on changes
CREATE TRIGGER trigger_update_seating_chart_timestamp
    BEFORE UPDATE ON seating_charts
    FOR EACH ROW
    EXECUTE FUNCTION update_seating_chart_timestamp();

-- Trigger: Create history entry on seating chart changes
CREATE TRIGGER trigger_create_seating_history
    AFTER INSERT OR UPDATE ON seating_charts
    FOR EACH ROW
    EXECUTE FUNCTION create_seating_history_entry();

-- Trigger: Update seat assignment student data
CREATE TRIGGER trigger_update_seat_assignment_data
    BEFORE INSERT OR UPDATE ON seat_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_seat_assignment_student_data();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE seating_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE seating_chart_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE seating_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE seating_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Teachers can view and manage their own seating charts
-- Note: teacher_id stores profile.id, not auth user id
CREATE POLICY seating_charts_teacher_policy ON seating_charts
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = seating_charts.teacher_id
            AND p.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = seating_charts.teacher_id
            AND p.user_id = auth.uid()
        )
    );

-- Policy: Teachers can manage seat assignments for their seating charts
CREATE POLICY seat_assignments_teacher_policy ON seat_assignments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM seating_charts sc
            JOIN profiles p ON p.id = sc.teacher_id
            WHERE sc.id = seat_assignments.seating_chart_id
            AND p.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM seating_charts sc
            JOIN profiles p ON p.id = sc.teacher_id
            WHERE sc.id = seat_assignments.seating_chart_id
            AND p.user_id = auth.uid()
        )
    );

-- Policy: Teachers can view and insert history for their seating charts
-- Note: INSERT is needed for triggers to work
CREATE POLICY seating_history_teacher_policy ON seating_chart_history
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = seating_chart_history.teacher_id
            AND p.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = seating_chart_history.teacher_id
            AND p.user_id = auth.uid()
        )
    );

-- Policy: Teachers can manage their seating preferences
CREATE POLICY seating_preferences_teacher_policy ON seating_preferences
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = seating_preferences.teacher_id
            AND p.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = seating_preferences.teacher_id
            AND p.user_id = auth.uid()
        )
    );

-- Policy: Teachers can view analytics for their seating charts
CREATE POLICY seating_analytics_teacher_policy ON seating_analytics
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM seating_charts sc
            JOIN profiles p ON p.id = sc.teacher_id
            WHERE sc.id = seating_analytics.seating_chart_id
            AND p.user_id = auth.uid()
        )
    );

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Note: Uncomment and customize the following section to insert sample data
-- Replace the UUIDs with actual IDs from your database

/*
-- Example: Get your class_id and teacher_id first
-- SELECT id, class_name FROM classes WHERE class_name = 'Grade 5A' LIMIT 1;
-- SELECT id, first_name, last_name FROM profiles WHERE role = 'teacher' AND email = 'teacher@example.com' LIMIT 1;

-- Sample Seating Chart
INSERT INTO seating_charts (
    class_id,
    teacher_id,
    layout_template_id,
    layout_name,
    rows,
    cols,
    total_seats,
    seat_pattern,
    name,
    description,
    is_active
)
VALUES (
    'your-class-uuid-here',           -- Get from: SELECT id FROM classes WHERE class_name = 'Grade B';
    'your-teacher-uuid-here',         -- Get from: SELECT id FROM profiles WHERE role = 'teacher';
    'usa-traditional',
    'USA Traditional Rows',
    5,
    6,
    30,
    '["seat","seat","seat","seat","seat","seat","seat","seat","seat","seat","seat","seat","seat","seat","seat","seat","seat","seat","seat","seat","seat","seat","seat","seat","seat","seat","seat","seat","seat","seat"]'::jsonb,
    'Fall 2024 Arrangement',
    'Traditional row arrangement for focused learning',
    true
);

-- Sample Seat Assignment
INSERT INTO seat_assignments (
    seating_chart_id,
    student_id,
    seat_id,
    row_index,
    col_index,
    assigned_by,
    assignment_method
)
VALUES (
    'seating-chart-uuid-from-above',
    'student-uuid-here',              -- Get from: SELECT id FROM profiles WHERE role = 'student';
    'A1',                             -- Front row, first seat
    0,                                -- Row index
    0,                                -- Column index
    'your-teacher-uuid-here',
    'manual'
);
*/

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Additional composite indexes for common queries
CREATE INDEX idx_seat_assignments_chart_student ON seat_assignments(seating_chart_id, student_id);
CREATE INDEX idx_seating_charts_class_active ON seating_charts(class_id, is_active, updated_at DESC);
CREATE INDEX idx_seating_history_chart_version ON seating_chart_history(seating_chart_id, version DESC);

-- GIN index for JSONB queries
CREATE INDEX idx_seating_charts_pattern_gin ON seating_charts USING GIN (seat_pattern);
CREATE INDEX idx_seating_history_snapshot_gin ON seating_chart_history USING GIN (assignments_snapshot);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE seating_charts IS 'Stores seating chart configurations for classes';
COMMENT ON TABLE seat_assignments IS 'Maps students to specific seats in seating charts';
COMMENT ON TABLE seating_chart_history IS 'Tracks version history and changes to seating arrangements';
COMMENT ON TABLE seating_preferences IS 'Stores teacher preferences for student seating';
COMMENT ON TABLE seating_analytics IS 'Tracks performance metrics for seating arrangements';

COMMENT ON COLUMN seating_charts.seat_pattern IS 'JSON array representing the layout: ["seat", "empty", "seat", ...]';
COMMENT ON COLUMN seat_assignments.assignment_method IS 'How the seat was assigned: manual, ai_auto_arrange, or imported';
COMMENT ON COLUMN seating_preferences.preference_type IS 'Type of seating preference: separate, together, near_front, etc.';

-- ============================================
-- END OF SCHEMA
-- ============================================
