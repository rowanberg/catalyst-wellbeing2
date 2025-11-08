-- =====================================================================
-- TIMETABLE MANAGEMENT SYSTEM - COMPLETE DATABASE SCHEMA
-- =====================================================================
-- This schema provides comprehensive timetable management for schools
-- including subjects, schemes, time slots, entries, and AI generation
-- =====================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- TABLE: subjects
-- Purpose: Store all subjects/courses offered by the school
-- =====================================================================
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g., 'Mathematics', 'English', 'Science'
    code VARCHAR(20) NOT NULL, -- e.g., 'MATH', 'ENG', 'SCI'
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color for UI display
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_subject_code_per_school UNIQUE(school_id, code),
    CONSTRAINT unique_subject_name_per_school UNIQUE(school_id, name)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subjects_school_id ON subjects(school_id);
CREATE INDEX IF NOT EXISTS idx_subjects_is_active ON subjects(school_id, is_active);

-- =====================================================================
-- TABLE: timetable_schemes
-- Purpose: Store timetable configuration templates (e.g., 6-period, 7-period)
-- =====================================================================
CREATE TABLE IF NOT EXISTS timetable_schemes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g., '6-Period Standard', '7-Period Extended'
    description TEXT,
    working_days TEXT[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], -- Days school operates
    periods_per_day INTEGER NOT NULL DEFAULT 6, -- Number of teaching periods
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false, -- One scheme can be marked as default
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_scheme_name_per_school UNIQUE(school_id, name),
    CONSTRAINT valid_periods_count CHECK (periods_per_day BETWEEN 1 AND 15)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_timetable_schemes_school_id ON timetable_schemes(school_id);
CREATE INDEX IF NOT EXISTS idx_timetable_schemes_is_active ON timetable_schemes(school_id, is_active);
CREATE INDEX IF NOT EXISTS idx_timetable_schemes_is_default ON timetable_schemes(school_id, is_default);

-- =====================================================================
-- TABLE: timetable_time_slots
-- Purpose: Store individual time slots (periods, breaks, lunch) for each scheme
-- =====================================================================
CREATE TABLE IF NOT EXISTS timetable_time_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_id UUID NOT NULL REFERENCES timetable_schemes(id) ON DELETE CASCADE,
    slot_type VARCHAR(20) NOT NULL CHECK (slot_type IN ('period', 'break', 'lunch')),
    label VARCHAR(50) NOT NULL, -- e.g., 'Period 1', 'Morning Break', 'Lunch'
    start_time TIME NOT NULL, -- e.g., '08:00'
    end_time TIME NOT NULL, -- e.g., '08:45'
    slot_order INTEGER NOT NULL, -- Order in the day (1, 2, 3, ...)
    duration_minutes INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (end_time - start_time)) / 60
    ) STORED, -- Auto-calculated duration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_slot_order_per_scheme UNIQUE(scheme_id, slot_order),
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    CONSTRAINT valid_slot_order CHECK (slot_order > 0)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_time_slots_scheme_id ON timetable_time_slots(scheme_id);
CREATE INDEX IF NOT EXISTS idx_time_slots_slot_type ON timetable_time_slots(scheme_id, slot_type);
CREATE INDEX IF NOT EXISTS idx_time_slots_order ON timetable_time_slots(scheme_id, slot_order);

-- =====================================================================
-- TABLE: timetable_entries
-- Purpose: Store actual timetable assignments (class, subject, teacher, time slot)
-- =====================================================================
CREATE TABLE IF NOT EXISTS timetable_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL, -- Teacher can be unassigned
    time_slot_id UUID NOT NULL REFERENCES timetable_time_slots(id) ON DELETE CASCADE,
    day_of_week VARCHAR(10) NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    room_number VARCHAR(20), -- Optional room assignment
    notes TEXT, -- Optional notes for special instructions
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL, -- Admin who created
    updated_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL, -- Admin who last updated
    CONSTRAINT unique_class_day_slot UNIQUE(class_id, day_of_week, time_slot_id)
    -- Note: Teacher role validation is handled by trigger below
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_timetable_entries_school_id ON timetable_entries(school_id);
CREATE INDEX IF NOT EXISTS idx_timetable_entries_class_id ON timetable_entries(class_id);
CREATE INDEX IF NOT EXISTS idx_timetable_entries_subject_id ON timetable_entries(subject_id);
CREATE INDEX IF NOT EXISTS idx_timetable_entries_teacher_id ON timetable_entries(teacher_id);
CREATE INDEX IF NOT EXISTS idx_timetable_entries_time_slot_id ON timetable_entries(time_slot_id);
CREATE INDEX IF NOT EXISTS idx_timetable_entries_day_of_week ON timetable_entries(day_of_week);
CREATE INDEX IF NOT EXISTS idx_timetable_entries_is_active ON timetable_entries(school_id, is_active);
CREATE INDEX IF NOT EXISTS idx_timetable_entries_class_day ON timetable_entries(class_id, day_of_week);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_timetable_entries_teacher_day ON timetable_entries(teacher_id, day_of_week) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_timetable_entries_class_active ON timetable_entries(class_id, is_active);

-- =====================================================================
-- TABLE: teacher_capabilities
-- Purpose: Store teacher preferences and capabilities for AI timetable generation
-- =====================================================================
CREATE TABLE IF NOT EXISTS teacher_capabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    subject_ids UUID[] DEFAULT ARRAY[]::UUID[], -- Array of subject IDs teacher can teach
    grade_levels TEXT[] DEFAULT ARRAY[]::TEXT[], -- e.g., ['1', '2', '3'] or ['9', '10', '11', '12']
    max_periods_per_day INTEGER DEFAULT 6, -- Maximum teaching periods per day
    max_periods_per_week INTEGER DEFAULT 30, -- Maximum teaching periods per week
    preferred_days TEXT[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    unavailable_slots JSONB DEFAULT '[]'::jsonb, -- Array of {day, slot_id} for unavailable times
    specializations TEXT[], -- e.g., ['Advanced Math', 'Lab Instructor']
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_teacher_capability UNIQUE(teacher_id),
    CONSTRAINT valid_max_periods_day CHECK (max_periods_per_day BETWEEN 1 AND 15),
    CONSTRAINT valid_max_periods_week CHECK (max_periods_per_week BETWEEN 1 AND 100)
    -- Note: Teacher role validation is handled by trigger below
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_teacher_capabilities_school_id ON teacher_capabilities(school_id);
CREATE INDEX IF NOT EXISTS idx_teacher_capabilities_teacher_id ON teacher_capabilities(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_capabilities_is_active ON teacher_capabilities(school_id, is_active);
CREATE INDEX IF NOT EXISTS idx_teacher_capabilities_subject_ids ON teacher_capabilities USING GIN (subject_ids);

-- =====================================================================
-- TABLE: timetable_conflicts
-- Purpose: Log detected conflicts for review and resolution
-- =====================================================================
CREATE TABLE IF NOT EXISTS timetable_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    conflict_type VARCHAR(50) NOT NULL, -- e.g., 'teacher_double_booking', 'room_double_booking'
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    entry_ids UUID[] NOT NULL, -- Array of conflicting timetable_entries IDs
    description TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_timetable_conflicts_school_id ON timetable_conflicts(school_id);
CREATE INDEX IF NOT EXISTS idx_timetable_conflicts_is_resolved ON timetable_conflicts(school_id, is_resolved);
CREATE INDEX IF NOT EXISTS idx_timetable_conflicts_severity ON timetable_conflicts(school_id, severity);
CREATE INDEX IF NOT EXISTS idx_timetable_conflicts_entry_ids ON timetable_conflicts USING GIN (entry_ids);

-- =====================================================================
-- TABLE: timetable_history
-- Purpose: Audit log for timetable changes
-- =====================================================================
CREATE TABLE IF NOT EXISTS timetable_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    entry_id UUID, -- NULL if entry was deleted
    action VARCHAR(20) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
    changed_by UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    old_data JSONB, -- Previous state
    new_data JSONB, -- New state
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_timetable_history_school_id ON timetable_history(school_id);
CREATE INDEX IF NOT EXISTS idx_timetable_history_entry_id ON timetable_history(entry_id);
CREATE INDEX IF NOT EXISTS idx_timetable_history_changed_by ON timetable_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_timetable_history_created_at ON timetable_history(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_timetable_history_action ON timetable_history(school_id, action);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

-- Enable RLS on all tables
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_history ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- RLS POLICIES: subjects
-- =====================================================================

-- Users can view subjects from their school
CREATE POLICY "Users can view subjects from their school" ON subjects
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Admins can insert subjects for their school
CREATE POLICY "Admins can insert subjects for their school" ON subjects
    FOR INSERT WITH CHECK (
        school_id IN (
            SELECT school_id FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update subjects from their school
CREATE POLICY "Admins can update subjects from their school" ON subjects
    FOR UPDATE USING (
        school_id IN (
            SELECT school_id FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can delete subjects from their school
CREATE POLICY "Admins can delete subjects from their school" ON subjects
    FOR DELETE USING (
        school_id IN (
            SELECT school_id FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================================
-- RLS POLICIES: timetable_schemes
-- =====================================================================

-- Users can view schemes from their school
CREATE POLICY "Users can view timetable schemes from their school" ON timetable_schemes
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Admins can insert schemes for their school
CREATE POLICY "Admins can insert timetable schemes for their school" ON timetable_schemes
    FOR INSERT WITH CHECK (
        school_id IN (
            SELECT school_id FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update schemes from their school
CREATE POLICY "Admins can update timetable schemes from their school" ON timetable_schemes
    FOR UPDATE USING (
        school_id IN (
            SELECT school_id FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can delete schemes from their school
CREATE POLICY "Admins can delete timetable schemes from their school" ON timetable_schemes
    FOR DELETE USING (
        school_id IN (
            SELECT school_id FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================================
-- RLS POLICIES: timetable_time_slots
-- =====================================================================

-- Users can view time slots from their school's schemes
CREATE POLICY "Users can view time slots from their school" ON timetable_time_slots
    FOR SELECT USING (
        scheme_id IN (
            SELECT id FROM timetable_schemes 
            WHERE school_id IN (
                SELECT school_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

-- Admins can insert time slots for their school's schemes
CREATE POLICY "Admins can insert time slots for their school" ON timetable_time_slots
    FOR INSERT WITH CHECK (
        scheme_id IN (
            SELECT id FROM timetable_schemes 
            WHERE school_id IN (
                SELECT school_id FROM profiles 
                WHERE user_id = auth.uid() AND role = 'admin'
            )
        )
    );

-- Admins can update time slots from their school's schemes
CREATE POLICY "Admins can update time slots from their school" ON timetable_time_slots
    FOR UPDATE USING (
        scheme_id IN (
            SELECT id FROM timetable_schemes 
            WHERE school_id IN (
                SELECT school_id FROM profiles 
                WHERE user_id = auth.uid() AND role = 'admin'
            )
        )
    );

-- Admins can delete time slots from their school's schemes
CREATE POLICY "Admins can delete time slots from their school" ON timetable_time_slots
    FOR DELETE USING (
        scheme_id IN (
            SELECT id FROM timetable_schemes 
            WHERE school_id IN (
                SELECT school_id FROM profiles 
                WHERE user_id = auth.uid() AND role = 'admin'
            )
        )
    );

-- =====================================================================
-- RLS POLICIES: timetable_entries
-- =====================================================================

-- Users can view timetable entries from their school
CREATE POLICY "Users can view timetable entries from their school" ON timetable_entries
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Admins can insert timetable entries for their school
CREATE POLICY "Admins can insert timetable entries for their school" ON timetable_entries
    FOR INSERT WITH CHECK (
        school_id IN (
            SELECT school_id FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update timetable entries from their school
CREATE POLICY "Admins can update timetable entries from their school" ON timetable_entries
    FOR UPDATE USING (
        school_id IN (
            SELECT school_id FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can delete timetable entries from their school
CREATE POLICY "Admins can delete timetable entries from their school" ON timetable_entries
    FOR DELETE USING (
        school_id IN (
            SELECT school_id FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================================
-- RLS POLICIES: teacher_capabilities
-- =====================================================================

-- Users can view teacher capabilities from their school
CREATE POLICY "Users can view teacher capabilities from their school" ON teacher_capabilities
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Admins and teachers can insert their own capabilities
CREATE POLICY "Admins and teachers can insert capabilities" ON teacher_capabilities
    FOR INSERT WITH CHECK (
        (teacher_id = auth.uid() OR 
         EXISTS (
             SELECT 1 FROM profiles 
             WHERE user_id = auth.uid() AND role = 'admin' AND school_id = teacher_capabilities.school_id
         ))
    );

-- Admins and teachers can update their own capabilities
CREATE POLICY "Admins and teachers can update capabilities" ON teacher_capabilities
    FOR UPDATE USING (
        teacher_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin' AND school_id = teacher_capabilities.school_id
        )
    );

-- Admins can delete capabilities from their school
CREATE POLICY "Admins can delete teacher capabilities" ON teacher_capabilities
    FOR DELETE USING (
        school_id IN (
            SELECT school_id FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================================
-- RLS POLICIES: timetable_conflicts
-- =====================================================================

-- Users can view conflicts from their school
CREATE POLICY "Users can view timetable conflicts from their school" ON timetable_conflicts
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- System can insert conflicts (no user restriction)
CREATE POLICY "System can insert timetable conflicts" ON timetable_conflicts
    FOR INSERT WITH CHECK (true);

-- Admins can update conflicts from their school
CREATE POLICY "Admins can update timetable conflicts" ON timetable_conflicts
    FOR UPDATE USING (
        school_id IN (
            SELECT school_id FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================================
-- RLS POLICIES: timetable_history
-- =====================================================================

-- Users can view history from their school
CREATE POLICY "Users can view timetable history from their school" ON timetable_history
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- System can insert history records (no user restriction)
CREATE POLICY "System can insert timetable history" ON timetable_history
    FOR INSERT WITH CHECK (true);

-- =====================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at column
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timetable_schemes_updated_at BEFORE UPDATE ON timetable_schemes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timetable_time_slots_updated_at BEFORE UPDATE ON timetable_time_slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timetable_entries_updated_at BEFORE UPDATE ON timetable_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teacher_capabilities_updated_at BEFORE UPDATE ON teacher_capabilities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timetable_conflicts_updated_at BEFORE UPDATE ON timetable_conflicts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- TRIGGER: Log timetable entry changes to history
-- =====================================================================

CREATE OR REPLACE FUNCTION log_timetable_entry_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO timetable_history (school_id, entry_id, action, changed_by, new_data, change_reason)
        VALUES (NEW.school_id, NEW.id, 'CREATE', NEW.created_by, row_to_json(NEW), 'Entry created');
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO timetable_history (school_id, entry_id, action, changed_by, old_data, new_data, change_reason)
        VALUES (NEW.school_id, NEW.id, 'UPDATE', NEW.updated_by, row_to_json(OLD), row_to_json(NEW), 'Entry updated');
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO timetable_history (school_id, entry_id, action, changed_by, old_data, change_reason)
        VALUES (OLD.school_id, OLD.id, 'DELETE', auth.uid(), row_to_json(OLD), 'Entry deleted');
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER timetable_entry_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON timetable_entries
FOR EACH ROW EXECUTE FUNCTION log_timetable_entry_changes();

-- =====================================================================
-- TRIGGER: Ensure only one default scheme per school
-- =====================================================================

CREATE OR REPLACE FUNCTION ensure_single_default_scheme()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        UPDATE timetable_schemes
        SET is_default = false
        WHERE school_id = NEW.school_id AND id != NEW.id AND is_default = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_single_default_scheme
BEFORE INSERT OR UPDATE ON timetable_schemes
FOR EACH ROW EXECUTE FUNCTION ensure_single_default_scheme();

-- =====================================================================
-- TRIGGER: Validate teacher role for timetable_entries
-- =====================================================================

CREATE OR REPLACE FUNCTION validate_teacher_role_for_entry()
RETURNS TRIGGER AS $$
BEGIN
    -- Only validate if teacher_id is not NULL
    IF NEW.teacher_id IS NOT NULL THEN
        -- Check if the teacher_id exists and has teacher role
        IF NOT EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = NEW.teacher_id AND role = 'teacher'
        ) THEN
            RAISE EXCEPTION 'Teacher ID % must reference a user with teacher role', NEW.teacher_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_teacher_role_entry
BEFORE INSERT OR UPDATE ON timetable_entries
FOR EACH ROW EXECUTE FUNCTION validate_teacher_role_for_entry();

-- =====================================================================
-- TRIGGER: Validate teacher role for teacher_capabilities
-- =====================================================================

CREATE OR REPLACE FUNCTION validate_teacher_role_for_capability()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the teacher_id exists and has teacher role
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = NEW.teacher_id AND role = 'teacher'
    ) THEN
        RAISE EXCEPTION 'Teacher ID % must reference a user with teacher role', NEW.teacher_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_teacher_role_capability
BEFORE INSERT OR UPDATE ON teacher_capabilities
FOR EACH ROW EXECUTE FUNCTION validate_teacher_role_for_capability();

-- =====================================================================
-- End of schema
-- =====================================================================
