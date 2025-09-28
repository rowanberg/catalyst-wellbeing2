-- Create comprehensive school details table for extended school information
-- This table will store all detailed school information including what's shown in student footer

CREATE TABLE IF NOT EXISTS school_details (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    -- Basic School Information (from existing schools table)
    school_name VARCHAR(255) NOT NULL,
    school_code VARCHAR(50) NOT NULL,
    principal_name VARCHAR(255),
    
    -- Contact Information
    primary_email VARCHAR(255),
    secondary_email VARCHAR(255),
    primary_phone VARCHAR(20),
    secondary_phone VARCHAR(20),
    fax_number VARCHAR(20),
    website_url VARCHAR(500),
    
    -- Address Information
    street_address TEXT,
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'United States',
    
    -- School Hours & Schedule
    school_start_time TIME DEFAULT '08:00:00',
    school_end_time TIME DEFAULT '15:30:00',
    office_start_time TIME DEFAULT '07:30:00',
    office_end_time TIME DEFAULT '16:00:00',
    lunch_start_time TIME DEFAULT '12:00:00',
    lunch_end_time TIME DEFAULT '13:00:00',
    
    -- Operating Days
    operates_monday BOOLEAN DEFAULT true,
    operates_tuesday BOOLEAN DEFAULT true,
    operates_wednesday BOOLEAN DEFAULT true,
    operates_thursday BOOLEAN DEFAULT true,
    operates_friday BOOLEAN DEFAULT true,
    operates_saturday BOOLEAN DEFAULT false,
    operates_sunday BOOLEAN DEFAULT false,
    
    -- Academic Information
    academic_year_start DATE,
    academic_year_end DATE,
    total_students INTEGER DEFAULT 0,
    total_teachers INTEGER DEFAULT 0,
    total_staff INTEGER DEFAULT 0,
    grade_levels_offered TEXT[], -- Array of grade levels like ['K', '1', '2', '3', '4', '5']
    school_type VARCHAR(50) DEFAULT 'Public', -- Public, Private, Charter, etc.
    
    -- Emergency Information
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    police_contact VARCHAR(20) DEFAULT '911',
    fire_department_contact VARCHAR(20) DEFAULT '911',
    hospital_contact VARCHAR(20),
    school_nurse_extension VARCHAR(10) DEFAULT '123',
    security_extension VARCHAR(10) DEFAULT '456',
    
    -- Additional School Information
    school_motto TEXT,
    school_mission TEXT,
    school_vision TEXT,
    established_year INTEGER,
    accreditation_body VARCHAR(255),
    district_name VARCHAR(255),
    
    -- Social Media & Communication
    facebook_url VARCHAR(500),
    twitter_url VARCHAR(500),
    instagram_url VARCHAR(500),
    linkedin_url VARCHAR(500),
    
    -- Special Programs & Features
    special_programs TEXT[], -- Array of special programs
    extracurricular_activities TEXT[], -- Array of activities
    sports_programs TEXT[], -- Array of sports
    
    -- Transportation
    bus_service_available BOOLEAN DEFAULT false,
    pickup_zones TEXT[], -- Array of pickup zones
    
    -- Facilities
    has_library BOOLEAN DEFAULT true,
    has_gymnasium BOOLEAN DEFAULT true,
    has_cafeteria BOOLEAN DEFAULT true,
    has_computer_lab BOOLEAN DEFAULT true,
    has_science_lab BOOLEAN DEFAULT false,
    has_art_room BOOLEAN DEFAULT false,
    has_music_room BOOLEAN DEFAULT false,
    
    -- Setup Status
    setup_completed BOOLEAN DEFAULT false,
    setup_completed_at TIMESTAMP WITH TIME ZONE,
    setup_completed_by UUID REFERENCES auth.users(id),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(school_id),
    CHECK (school_start_time < school_end_time),
    CHECK (office_start_time < office_end_time),
    CHECK (lunch_start_time < lunch_end_time),
    CHECK (total_students >= 0),
    CHECK (total_teachers >= 0),
    CHECK (total_staff >= 0)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_school_details_school_id ON school_details(school_id);
CREATE INDEX IF NOT EXISTS idx_school_details_setup_completed ON school_details(setup_completed);
CREATE INDEX IF NOT EXISTS idx_school_details_created_at ON school_details(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_school_details_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_school_details_updated_at
    BEFORE UPDATE ON school_details
    FOR EACH ROW
    EXECUTE FUNCTION update_school_details_updated_at();

-- Enable Row Level Security
ALTER TABLE school_details ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "School details are viewable by school members" ON school_details
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "School details are editable by school admins" ON school_details
    FOR ALL USING (
        school_id IN (
            SELECT school_id FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'principal')
        )
    );

-- Insert default records for existing schools that don't have details yet
INSERT INTO school_details (
    school_id, 
    school_name, 
    school_code, 
    primary_email,
    primary_phone,
    street_address,
    setup_completed
)
SELECT 
    s.id,
    s.name,
    s.school_code,
    s.email,
    s.phone,
    s.address,
    false -- Mark as not completed to trigger setup flow
FROM schools s
WHERE s.id NOT IN (SELECT school_id FROM school_details)
ON CONFLICT (school_id) DO NOTHING;

-- Comment on table
COMMENT ON TABLE school_details IS 'Comprehensive school information including contact details, hours, academic info, and setup status';
