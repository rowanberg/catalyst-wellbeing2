-- School Events Hub Database Schema
-- This schema supports comprehensive event management, registration, and participation tracking

-- Main school events table
CREATE TABLE IF NOT EXISTS school_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) CHECK (event_type IN (
        'academic', 'sports', 'cultural', 'social', 'fundraising', 'workshop', 
        'competition', 'field_trip', 'assembly', 'meeting', 'celebration', 'other'
    )) NOT NULL,
    category VARCHAR(50) CHECK (category IN (
        'mandatory', 'optional', 'invitation_only', 'open_to_all', 'grade_specific'
    )) DEFAULT 'optional',
    
    -- Event scheduling
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ NOT NULL,
    registration_start TIMESTAMPTZ,
    registration_end TIMESTAMPTZ,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern JSONB, -- {frequency: "weekly", interval: 1, days: ["monday"], end_date: "2025-12-31"}
    
    -- Location details
    location_type VARCHAR(20) CHECK (location_type IN ('on_campus', 'off_campus', 'online', 'hybrid')) DEFAULT 'on_campus',
    venue_name VARCHAR(200),
    venue_address TEXT,
    room_number VARCHAR(50),
    online_link TEXT,
    meeting_id VARCHAR(100),
    location_notes TEXT,
    
    -- Capacity and registration
    max_participants INTEGER,
    min_participants INTEGER DEFAULT 1,
    current_registrations INTEGER DEFAULT 0,
    waitlist_enabled BOOLEAN DEFAULT false,
    registration_required BOOLEAN DEFAULT true,
    registration_fee DECIMAL(8,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Target audience
    target_grades TEXT[] DEFAULT '{}', -- ['9', '10', '11', '12']
    target_roles TEXT[] DEFAULT ARRAY['student'], -- ['student', 'teacher', 'parent']
    is_public BOOLEAN DEFAULT false, -- Visible to external community
    
    -- Event details
    organizer_id UUID NOT NULL REFERENCES profiles(id),
    co_organizers UUID[] DEFAULT '{}',
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    event_image_url TEXT,
    banner_image_url TEXT,
    
    -- Requirements and preparation
    prerequisites TEXT[],
    materials_needed TEXT[],
    dress_code VARCHAR(100),
    special_instructions TEXT,
    
    -- Status and visibility
    status VARCHAR(20) CHECK (status IN ('draft', 'published', 'cancelled', 'completed', 'postponed')) DEFAULT 'draft',
    visibility VARCHAR(20) CHECK (visibility IN ('public', 'private', 'restricted')) DEFAULT 'public',
    approval_required BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    featured BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CHECK (end_datetime > start_datetime),
    CHECK (registration_end IS NULL OR registration_end <= start_datetime),
    CHECK (max_participants IS NULL OR max_participants > 0)
);

-- Event registrations and RSVPs
CREATE TABLE IF NOT EXISTS event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES school_events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    registration_type VARCHAR(20) CHECK (registration_type IN ('registered', 'waitlisted', 'invited')) DEFAULT 'registered',
    status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'cancelled', 'attended', 'no_show')) DEFAULT 'pending',
    
    -- Registration details
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    
    -- Additional information
    guest_count INTEGER DEFAULT 0 CHECK (guest_count >= 0),
    guest_names TEXT[],
    dietary_restrictions TEXT,
    accessibility_needs TEXT,
    special_requests TEXT,
    emergency_contact JSONB, -- {name: "...", phone: "...", relationship: "..."}
    
    -- Payment (if applicable)
    payment_status VARCHAR(20) CHECK (payment_status IN ('not_required', 'pending', 'paid', 'refunded', 'failed')) DEFAULT 'not_required',
    payment_amount DECIMAL(8,2) DEFAULT 0.00,
    payment_reference VARCHAR(100),
    payment_date TIMESTAMPTZ,
    
    -- Check-in/attendance
    checked_in_at TIMESTAMPTZ,
    checked_in_by UUID REFERENCES profiles(id),
    attendance_notes TEXT,
    
    UNIQUE(event_id, user_id)
);

-- Event sessions/agenda items
CREATE TABLE IF NOT EXISTS event_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES school_events(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    session_type VARCHAR(30) CHECK (session_type IN (
        'presentation', 'workshop', 'discussion', 'performance', 'ceremony', 
        'break', 'meal', 'activity', 'competition', 'other'
    )) DEFAULT 'presentation',
    
    -- Timing
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (end_time - start_time))/60
    ) STORED,
    
    -- Location (can be different from main event)
    location_override VARCHAR(200),
    room_override VARCHAR(50),
    
    -- Presenters/facilitators
    presenter_ids UUID[] DEFAULT '{}',
    presenter_names TEXT[], -- For external presenters
    
    -- Session details
    capacity INTEGER,
    materials_needed TEXT[],
    is_mandatory BOOLEAN DEFAULT false,
    requires_registration BOOLEAN DEFAULT false,
    
    -- Content
    agenda_items JSONB DEFAULT '[]', -- [{time: "10:00", item: "Welcome", duration: 15}]
    learning_objectives TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CHECK (end_time > start_time)
);

-- Event announcements and updates
CREATE TABLE IF NOT EXISTS event_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES school_events(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    announcement_type VARCHAR(20) CHECK (announcement_type IN (
        'general', 'reminder', 'update', 'cancellation', 'postponement', 'urgent'
    )) DEFAULT 'general',
    
    -- Targeting
    target_audience VARCHAR(20) CHECK (target_audience IN ('all', 'registered', 'waitlisted', 'organizers')) DEFAULT 'all',
    
    -- Delivery
    send_email BOOLEAN DEFAULT false,
    send_push BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    
    -- Scheduling
    scheduled_send TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event feedback and surveys
CREATE TABLE IF NOT EXISTS event_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES school_events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Ratings (1-5 scale)
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    organization_rating INTEGER CHECK (organization_rating >= 1 AND organization_rating <= 5),
    content_rating INTEGER CHECK (content_rating >= 1 AND content_rating <= 5),
    venue_rating INTEGER CHECK (venue_rating >= 1 AND venue_rating <= 5),
    
    -- Written feedback
    what_liked TEXT,
    what_improved TEXT,
    suggestions TEXT,
    would_recommend BOOLEAN,
    would_attend_again BOOLEAN,
    
    -- Additional questions (customizable)
    custom_responses JSONB DEFAULT '{}', -- {question_id: "answer", ...}
    
    -- Metadata
    is_anonymous BOOLEAN DEFAULT false,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(event_id, user_id)
);

-- Event resources and documents
CREATE TABLE IF NOT EXISTS event_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES school_events(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    resource_type VARCHAR(30) CHECK (resource_type IN (
        'agenda', 'presentation', 'handout', 'form', 'map', 'schedule', 
        'guidelines', 'requirements', 'photo', 'video', 'other'
    )) NOT NULL,
    
    -- File details
    file_url TEXT,
    file_name VARCHAR(255),
    file_size INTEGER,
    file_format VARCHAR(10),
    
    -- Access control
    visibility VARCHAR(20) CHECK (visibility IN ('public', 'registered_only', 'organizers_only')) DEFAULT 'registered_only',
    available_before_event BOOLEAN DEFAULT true,
    available_during_event BOOLEAN DEFAULT true,
    available_after_event BOOLEAN DEFAULT true,
    
    -- Usage tracking
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event photos and media
CREATE TABLE IF NOT EXISTS event_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES school_events(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    media_type VARCHAR(20) CHECK (media_type IN ('photo', 'video', 'audio')) NOT NULL,
    title VARCHAR(200),
    description TEXT,
    
    -- File details
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_size INTEGER,
    duration_seconds INTEGER, -- For video/audio
    
    -- Metadata
    taken_at TIMESTAMPTZ,
    camera_info JSONB, -- {camera: "iPhone 12", settings: {...}}
    location_info JSONB, -- {lat: 40.7128, lng: -74.0060, address: "..."}
    
    -- Moderation and privacy
    is_approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    is_featured BOOLEAN DEFAULT false,
    privacy_level VARCHAR(20) CHECK (privacy_level IN ('public', 'school_only', 'participants_only')) DEFAULT 'school_only',
    
    -- Engagement
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event volunteers and staff
CREATE TABLE IF NOT EXISTS event_volunteers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES school_events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(100) NOT NULL, -- 'Registration Desk', 'Setup Crew', 'Photography', etc.
    responsibilities TEXT[],
    
    -- Scheduling
    shift_start TIMESTAMPTZ,
    shift_end TIMESTAMPTZ,
    hours_committed DECIMAL(4,2),
    hours_completed DECIMAL(4,2) DEFAULT 0,
    
    -- Status
    status VARCHAR(20) CHECK (status IN ('applied', 'accepted', 'declined', 'completed', 'no_show')) DEFAULT 'applied',
    application_message TEXT,
    
    -- Recognition
    volunteer_hours_awarded DECIMAL(4,2) DEFAULT 0,
    certificate_issued BOOLEAN DEFAULT false,
    
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    
    UNIQUE(event_id, user_id, role)
);

-- Event competitions and contests
CREATE TABLE IF NOT EXISTS event_competitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES school_events(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    competition_type VARCHAR(50) CHECK (competition_type IN (
        'academic', 'sports', 'arts', 'debate', 'quiz', 'talent', 'science_fair', 'other'
    )) NOT NULL,
    
    -- Rules and format
    rules TEXT,
    judging_criteria JSONB, -- [{criterion: "Creativity", weight: 30}, ...]
    max_participants INTEGER,
    team_size_min INTEGER DEFAULT 1,
    team_size_max INTEGER DEFAULT 1,
    
    -- Prizes and recognition
    prizes JSONB DEFAULT '[]', -- [{place: 1, prize: "Trophy + $100", description: "..."}]
    
    -- Registration
    registration_required BOOLEAN DEFAULT true,
    registration_fee DECIMAL(8,2) DEFAULT 0.00,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competition participants and results
CREATE TABLE IF NOT EXISTS competition_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID NOT NULL REFERENCES event_competitions(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    team_name VARCHAR(100),
    team_members UUID[] DEFAULT '{}', -- For team competitions
    
    -- Submission/performance
    submission_title VARCHAR(200),
    submission_description TEXT,
    submission_files JSONB DEFAULT '[]', -- [{type: "document", url: "...", name: "..."}]
    
    -- Scoring
    scores JSONB DEFAULT '{}', -- {judge_id: {criterion1: score, criterion2: score, ...}}
    final_score DECIMAL(8,2),
    rank_position INTEGER,
    
    -- Awards
    award_received VARCHAR(100), -- "1st Place", "Best Innovation", etc.
    certificate_url TEXT,
    
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    
    UNIQUE(competition_id, participant_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_school_events_school_date ON school_events(school_id, start_datetime DESC);
CREATE INDEX IF NOT EXISTS idx_school_events_status ON school_events(status) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_school_events_type ON school_events(event_type);
CREATE INDEX IF NOT EXISTS idx_school_events_featured ON school_events(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_school_events_tags ON school_events USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_school_events_target_grades ON school_events USING GIN(target_grades);

CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(status);

CREATE INDEX IF NOT EXISTS idx_event_sessions_event_time ON event_sessions(event_id, start_time);

CREATE INDEX IF NOT EXISTS idx_event_feedback_event ON event_feedback(event_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_rating ON event_feedback(overall_rating DESC);

CREATE INDEX IF NOT EXISTS idx_event_resources_event ON event_resources(event_id);
CREATE INDEX IF NOT EXISTS idx_event_resources_type ON event_resources(resource_type);

CREATE INDEX IF NOT EXISTS idx_event_media_event ON event_media(event_id);
CREATE INDEX IF NOT EXISTS idx_event_media_approved ON event_media(is_approved) WHERE is_approved = true;

-- Triggers for updated_at
CREATE TRIGGER update_school_events_updated_at BEFORE UPDATE ON school_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_resources_updated_at BEFORE UPDATE ON event_resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update registration count
CREATE OR REPLACE FUNCTION update_event_registration_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.registration_type = 'registered' AND NEW.status IN ('pending', 'confirmed') THEN
            UPDATE school_events 
            SET current_registrations = current_registrations + 1,
                updated_at = NOW()
            WHERE id = NEW.event_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle status changes
        IF OLD.status != NEW.status THEN
            IF OLD.status IN ('pending', 'confirmed') AND NEW.status NOT IN ('pending', 'confirmed') THEN
                -- Registration was cancelled/removed
                UPDATE school_events 
                SET current_registrations = current_registrations - 1,
                    updated_at = NOW()
                WHERE id = NEW.event_id;
            ELSIF OLD.status NOT IN ('pending', 'confirmed') AND NEW.status IN ('pending', 'confirmed') THEN
                -- Registration was restored
                UPDATE school_events 
                SET current_registrations = current_registrations + 1,
                    updated_at = NOW()
                WHERE id = NEW.event_id;
            END IF;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.registration_type = 'registered' AND OLD.status IN ('pending', 'confirmed') THEN
            UPDATE school_events 
            SET current_registrations = current_registrations - 1,
                updated_at = NOW()
            WHERE id = OLD.event_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_event_registration_count 
    AFTER INSERT OR UPDATE OR DELETE ON event_registrations 
    FOR EACH ROW EXECUTE FUNCTION update_event_registration_count();

-- RLS Policies
ALTER TABLE school_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_media ENABLE ROW LEVEL SECURITY;

-- Policies for school_events
CREATE POLICY "Users can view published events in their school" ON school_events
    FOR SELECT USING (
        status = 'published' AND 
        school_id IN (SELECT school_id FROM profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Event organizers can manage their events" ON school_events
    FOR ALL USING (
        organizer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
        (SELECT id FROM profiles WHERE user_id = auth.uid()) = ANY(co_organizers)
    );

-- Sample data
INSERT INTO school_events (school_id, title, description, event_type, start_datetime, end_datetime, organizer_id, max_participants, target_grades) VALUES
(
    (SELECT id FROM schools LIMIT 1),
    'Annual Science Fair',
    'Showcase your scientific projects and innovations. Open to all grade levels with exciting prizes and recognition.',
    'competition',
    '2025-10-15 09:00:00+00',
    '2025-10-15 16:00:00+00',
    (SELECT id FROM profiles WHERE role = 'teacher' LIMIT 1),
    200,
    ARRAY['9', '10', '11', '12']
),
(
    (SELECT id FROM schools LIMIT 1),
    'Winter Concert',
    'Join us for an evening of beautiful music performed by our talented students from the school band and choir.',
    'cultural',
    '2025-12-10 19:00:00+00',
    '2025-12-10 21:00:00+00',
    (SELECT id FROM profiles WHERE role = 'teacher' LIMIT 1 OFFSET 1),
    500,
    ARRAY['8', '9', '10', '11', '12']
),
(
    (SELECT id FROM schools LIMIT 1),
    'College Preparation Workshop',
    'Essential workshop for seniors covering college applications, essay writing, and scholarship opportunities.',
    'workshop',
    '2025-11-05 14:00:00+00',
    '2025-11-05 17:00:00+00',
    (SELECT id FROM profiles WHERE role = 'teacher' LIMIT 1 OFFSET 2),
    50,
    ARRAY['12']
);
