-- Peer Tutoring Database Schema
-- This schema supports student-to-student tutoring with matching, scheduling, and payment features

-- Tutor profiles and qualifications
CREATE TABLE IF NOT EXISTS tutor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    bio TEXT DEFAULT 'Passionate about helping students learn and succeed.',
    hourly_rate DECIMAL(8,2) DEFAULT 0.00 CHECK (hourly_rate >= 0), -- In local currency
    is_verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMPTZ,
    verified_by UUID REFERENCES profiles(id),
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'suspended', 'pending_approval')) DEFAULT 'pending_approval',
    total_sessions INTEGER DEFAULT 0 CHECK (total_sessions >= 0),
    total_earnings DECIMAL(10,2) DEFAULT 0.00 CHECK (total_earnings >= 0),
    average_rating DECIMAL(3,2) DEFAULT 0.0 CHECK (average_rating >= 0 AND average_rating <= 5),
    total_ratings INTEGER DEFAULT 0 CHECK (total_ratings >= 0),
    response_time_hours INTEGER DEFAULT 24 CHECK (response_time_hours > 0), -- Average response time
    availability_schedule JSONB DEFAULT '{}', -- {monday: [{start: "09:00", end: "17:00"}], ...}
    preferred_location VARCHAR(50) CHECK (preferred_location IN ('online', 'library', 'classroom', 'flexible')) DEFAULT 'flexible',
    max_students_per_session INTEGER DEFAULT 1 CHECK (max_students_per_session > 0 AND max_students_per_session <= 10),
    languages TEXT[] DEFAULT ARRAY['English'], -- Languages spoken
    is_available BOOLEAN DEFAULT true, -- Currently accepting new students
    profile_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, school_id)
);

-- Tutor subject expertise and qualifications
CREATE TABLE IF NOT EXISTS tutor_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    grade_levels TEXT[] NOT NULL, -- ['9', '10', '11', '12']
    proficiency_level VARCHAR(20) CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')) DEFAULT 'intermediate',
    years_experience INTEGER DEFAULT 0,
    certifications TEXT[] DEFAULT '{}', -- Any relevant certifications
    sample_materials JSONB DEFAULT '[]', -- [{type: "document", name: "...", url: "..."}]
    is_primary BOOLEAN DEFAULT false, -- Main subject of expertise
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tutoring session requests
CREATE TABLE IF NOT EXISTS tutoring_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tutor_id UUID REFERENCES tutor_profiles(id) ON DELETE SET NULL,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    grade_level VARCHAR(10) NOT NULL,
    session_type VARCHAR(30) CHECK (session_type IN ('one-time', 'recurring', 'exam_prep', 'homework_help', 'concept_review')) DEFAULT 'one-time',
    urgency VARCHAR(20) CHECK (urgency IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    preferred_schedule JSONB, -- {date: "2025-09-28", time: "16:00", duration: 60, flexible: true}
    location_preference VARCHAR(50) CHECK (location_preference IN ('online', 'library', 'classroom', 'flexible')) DEFAULT 'online',
    budget_range JSONB, -- {min: 10, max: 25, currency: "USD"}
    description TEXT NOT NULL, -- What help is needed
    learning_goals TEXT[], -- Specific objectives
    difficulty_areas TEXT[], -- Specific topics needing help
    previous_experience TEXT, -- Student's background in subject
    special_requirements TEXT, -- Any accommodations needed
    status VARCHAR(30) CHECK (status IN ('open', 'matched', 'scheduled', 'in_progress', 'completed', 'cancelled', 'expired')) DEFAULT 'open',
    matched_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tutoring sessions
CREATE TABLE IF NOT EXISTS tutoring_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES tutoring_requests(id) ON DELETE SET NULL,
    tutor_id UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    grade_level VARCHAR(10) NOT NULL,
    session_type VARCHAR(30) CHECK (session_type IN ('one-time', 'recurring', 'exam_prep', 'homework_help', 'concept_review')) DEFAULT 'one-time',
    
    -- Scheduling
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    duration_minutes INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN actual_start IS NOT NULL AND actual_end IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (actual_end - actual_start))/60
            ELSE EXTRACT(EPOCH FROM (scheduled_end - scheduled_start))/60
        END
    ) STORED,
    
    -- Location and setup
    location_type VARCHAR(20) CHECK (location_type IN ('online', 'physical', 'hybrid')) DEFAULT 'online',
    location_details JSONB, -- {room: "Library Room 3", zoom_link: "...", platform: "zoom"}
    
    -- Session content
    agenda JSONB DEFAULT '[]', -- [{time: "16:00", topic: "Quadratic Equations", duration: 30}]
    learning_objectives TEXT[],
    materials_needed TEXT[],
    homework_assigned TEXT,
    
    -- Pricing and payment
    hourly_rate DECIMAL(8,2) NOT NULL,
    total_cost DECIMAL(8,2),
    payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'paid', 'refunded', 'disputed')) DEFAULT 'pending',
    payment_method VARCHAR(30),
    payment_reference VARCHAR(100),
    
    -- Session status and outcomes
    status VARCHAR(20) CHECK (status IN ('scheduled', 'confirmed', 'ongoing', 'completed', 'cancelled', 'no_show')) DEFAULT 'scheduled',
    cancellation_reason TEXT,
    cancelled_by UUID REFERENCES profiles(id),
    cancelled_at TIMESTAMPTZ,
    
    -- Session notes and feedback
    tutor_notes TEXT, -- Private notes for tutor
    session_summary TEXT, -- Summary of what was covered
    student_progress_notes TEXT, -- Progress observations
    next_session_recommendations TEXT,
    
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session attendance and participation
CREATE TABLE IF NOT EXISTS tutoring_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES tutoring_sessions(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) CHECK (role IN ('tutor', 'student', 'observer')) NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    attendance_status VARCHAR(20) CHECK (attendance_status IN ('present', 'late', 'absent', 'excused')) DEFAULT 'present',
    participation_score INTEGER CHECK (participation_score >= 1 AND participation_score <= 10),
    technical_issues JSONB DEFAULT '[]', -- [{issue: "audio_problem", resolved: true, time: "16:15"}]
    
    UNIQUE(session_id, participant_id)
);

-- Session ratings and reviews
CREATE TABLE IF NOT EXISTS tutoring_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES tutoring_sessions(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reviewer_type VARCHAR(20) CHECK (reviewer_type IN ('student', 'tutor')) NOT NULL,
    
    -- Ratings (1-5 scale)
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5) NOT NULL,
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    knowledge_rating INTEGER CHECK (knowledge_rating >= 1 AND knowledge_rating <= 5),
    patience_rating INTEGER CHECK (patience_rating >= 1 AND patience_rating <= 5),
    punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
    
    -- Written feedback
    review_text TEXT,
    pros TEXT[], -- What went well
    improvements TEXT[], -- Areas for improvement
    would_recommend BOOLEAN,
    would_book_again BOOLEAN,
    
    -- Moderation
    is_verified BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    is_hidden BOOLEAN DEFAULT false,
    moderated_by UUID REFERENCES profiles(id),
    moderated_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(session_id, reviewer_id, reviewee_id)
);

-- Tutor applications and verification
CREATE TABLE IF NOT EXISTS tutor_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    -- Application details
    motivation TEXT NOT NULL, -- Why they want to be a tutor
    experience_description TEXT, -- Previous tutoring/teaching experience
    academic_achievements TEXT[], -- Grades, awards, etc.
    subjects_to_tutor JSONB NOT NULL, -- [{subject: "Math", grades: ["9", "10"], experience: "2 years"}]
    availability JSONB NOT NULL, -- Schedule availability
    preferred_rate DECIMAL(8,2),
    
    -- Supporting documents
    transcript_url TEXT,
    recommendation_letters JSONB DEFAULT '[]', -- [{name: "Teacher Name", email: "...", letter_url: "..."}]
    certificates JSONB DEFAULT '[]', -- [{name: "Certificate Name", url: "...", issued_by: "..."}]
    
    -- Application status
    status VARCHAR(30) CHECK (status IN ('submitted', 'under_review', 'interview_scheduled', 'approved', 'rejected', 'withdrawn')) DEFAULT 'submitted',
    reviewed_by UUID REFERENCES profiles(id),
    review_notes TEXT,
    interview_scheduled_at TIMESTAMPTZ,
    interview_completed_at TIMESTAMPTZ,
    decision_made_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, school_id)
);

-- Tutor earnings and payments
CREATE TABLE IF NOT EXISTS tutor_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES tutoring_sessions(id) ON DELETE CASCADE,
    gross_amount DECIMAL(8,2) NOT NULL, -- Total session cost
    platform_fee DECIMAL(8,2) DEFAULT 0.00, -- Platform commission
    net_amount DECIMAL(8,2) NOT NULL, -- Amount tutor receives
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Payment processing
    payout_status VARCHAR(20) CHECK (payout_status IN ('pending', 'processing', 'paid', 'failed', 'disputed')) DEFAULT 'pending',
    payout_method VARCHAR(30), -- bank_transfer, paypal, etc.
    payout_reference VARCHAR(100),
    payout_date TIMESTAMPTZ,
    
    -- Tax and reporting
    tax_year INTEGER,
    is_taxable BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tutoring resources and materials
CREATE TABLE IF NOT EXISTS tutoring_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    subject VARCHAR(100) NOT NULL,
    grade_levels TEXT[] NOT NULL,
    resource_type VARCHAR(30) CHECK (resource_type IN ('worksheet', 'video', 'presentation', 'quiz', 'game', 'reference', 'template')) NOT NULL,
    file_url TEXT,
    file_size INTEGER,
    file_format VARCHAR(10),
    preview_url TEXT, -- Thumbnail or preview
    
    -- Access control
    is_public BOOLEAN DEFAULT false, -- Available to all tutors
    is_premium BOOLEAN DEFAULT false, -- Requires payment
    price DECIMAL(8,2) DEFAULT 0.00,
    
    -- Usage statistics
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    rating_average DECIMAL(3,2) DEFAULT 0.0,
    rating_count INTEGER DEFAULT 0,
    
    -- Categorization
    tags TEXT[] DEFAULT '{}',
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'intermediate',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tutor-student matching preferences
CREATE TABLE IF NOT EXISTS tutoring_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user_type VARCHAR(20) CHECK (user_type IN ('student', 'tutor')) NOT NULL,
    
    -- Matching preferences
    preferred_subjects TEXT[],
    preferred_grade_levels TEXT[],
    preferred_session_types TEXT[], -- one-time, recurring, etc.
    preferred_times JSONB, -- {weekdays: ["monday", "wednesday"], hours: ["16:00-18:00"]}
    preferred_locations TEXT[], -- online, library, etc.
    budget_range JSONB, -- {min: 10, max: 30}
    
    -- Learning style preferences (for students)
    learning_style VARCHAR(30) CHECK (learning_style IN ('visual', 'auditory', 'kinesthetic', 'reading_writing', 'mixed')),
    pace_preference VARCHAR(20) CHECK (pace_preference IN ('slow', 'moderate', 'fast', 'adaptive')),
    
    -- Teaching style preferences (for tutors)
    teaching_methods TEXT[], -- interactive, lecture, hands-on, etc.
    group_size_preference VARCHAR(20) CHECK (group_size_preference IN ('one-on-one', 'small_group', 'flexible')),
    
    -- Communication preferences
    preferred_languages TEXT[] DEFAULT ARRAY['English'],
    communication_style VARCHAR(30) CHECK (communication_style IN ('formal', 'casual', 'encouraging', 'direct')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_school_status ON tutor_profiles(school_id, status);
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_user ON tutor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_rating ON tutor_profiles(average_rating DESC) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_tutor_subjects_tutor ON tutor_subjects(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutor_subjects_subject ON tutor_subjects(subject);
CREATE INDEX IF NOT EXISTS idx_tutor_subjects_grade_levels ON tutor_subjects USING GIN(grade_levels);

CREATE INDEX IF NOT EXISTS idx_tutoring_requests_student ON tutoring_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_requests_tutor ON tutoring_requests(tutor_id) WHERE tutor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tutoring_requests_status ON tutoring_requests(status);
CREATE INDEX IF NOT EXISTS idx_tutoring_requests_subject_grade ON tutoring_requests(subject, grade_level);
CREATE INDEX IF NOT EXISTS idx_tutoring_requests_school ON tutoring_requests(school_id);

CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_tutor_date ON tutoring_sessions(tutor_id, scheduled_start DESC);
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_student_date ON tutoring_sessions(student_id, scheduled_start DESC);
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_status ON tutoring_sessions(status);
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_school ON tutoring_sessions(school_id);

CREATE INDEX IF NOT EXISTS idx_tutoring_reviews_session ON tutoring_reviews(session_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_reviews_reviewee ON tutoring_reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_reviews_rating ON tutoring_reviews(overall_rating DESC);

-- Triggers for updated_at
CREATE TRIGGER update_tutor_profiles_updated_at BEFORE UPDATE ON tutor_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tutoring_requests_updated_at BEFORE UPDATE ON tutoring_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tutoring_sessions_updated_at BEFORE UPDATE ON tutoring_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tutoring_reviews_updated_at BEFORE UPDATE ON tutoring_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tutor_applications_updated_at BEFORE UPDATE ON tutor_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tutoring_resources_updated_at BEFORE UPDATE ON tutoring_resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tutoring_preferences_updated_at BEFORE UPDATE ON tutoring_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update tutor ratings
CREATE OR REPLACE FUNCTION update_tutor_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Update tutor profile ratings
        UPDATE tutor_profiles 
        SET 
            average_rating = (
                SELECT COALESCE(AVG(overall_rating), 0) 
                FROM tutoring_reviews 
                WHERE reviewee_id = (SELECT user_id FROM tutor_profiles WHERE id = 
                    (SELECT tutor_id FROM tutoring_sessions WHERE id = NEW.session_id))
                AND reviewer_type = 'student'
            ),
            total_ratings = (
                SELECT COUNT(*) 
                FROM tutoring_reviews 
                WHERE reviewee_id = (SELECT user_id FROM tutor_profiles WHERE id = 
                    (SELECT tutor_id FROM tutoring_sessions WHERE id = NEW.session_id))
                AND reviewer_type = 'student'
            ),
            updated_at = NOW()
        WHERE id = (SELECT tutor_id FROM tutoring_sessions WHERE id = NEW.session_id);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update tutor profile ratings after deletion
        UPDATE tutor_profiles 
        SET 
            average_rating = (
                SELECT COALESCE(AVG(overall_rating), 0) 
                FROM tutoring_reviews 
                WHERE reviewee_id = (SELECT user_id FROM tutor_profiles WHERE id = 
                    (SELECT tutor_id FROM tutoring_sessions WHERE id = OLD.session_id))
                AND reviewer_type = 'student'
            ),
            total_ratings = (
                SELECT COUNT(*) 
                FROM tutoring_reviews 
                WHERE reviewee_id = (SELECT user_id FROM tutor_profiles WHERE id = 
                    (SELECT tutor_id FROM tutoring_sessions WHERE id = OLD.session_id))
                AND reviewer_type = 'student'
            ),
            updated_at = NOW()
        WHERE id = (SELECT tutor_id FROM tutoring_sessions WHERE id = OLD.session_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_tutor_rating 
    AFTER INSERT OR UPDATE OR DELETE ON tutoring_reviews 
    FOR EACH ROW EXECUTE FUNCTION update_tutor_rating();

-- Function to update tutor session count and earnings
CREATE OR REPLACE FUNCTION update_tutor_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.status = 'completed' THEN
            UPDATE tutor_profiles 
            SET 
                total_sessions = (
                    SELECT COUNT(*) 
                    FROM tutoring_sessions 
                    WHERE tutor_id = NEW.tutor_id AND status = 'completed'
                ),
                total_earnings = (
                    SELECT COALESCE(SUM(net_amount), 0) 
                    FROM tutor_earnings 
                    WHERE tutor_id = NEW.tutor_id
                ),
                updated_at = NOW()
            WHERE id = NEW.tutor_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Function to validate tutor profile user role
CREATE OR REPLACE FUNCTION validate_tutor_user_role() RETURNS TRIGGER AS $$
BEGIN
    -- Check if user exists and has valid role
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = NEW.user_id 
        AND school_id = NEW.school_id 
        AND role IN ('student', 'teacher')
    ) THEN
        RAISE EXCEPTION 'User does not exist or does not have permission to be a tutor (must be student or teacher)';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tutor profile validation
CREATE TRIGGER validate_tutor_user_role_trigger
    BEFORE INSERT OR UPDATE ON tutor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION validate_tutor_user_role();

-- Function to safely create tutor profile
CREATE OR REPLACE FUNCTION create_tutor_profile(
    p_user_id UUID,
    p_school_id UUID,
    p_bio TEXT DEFAULT NULL,
    p_hourly_rate DECIMAL DEFAULT 0.00,
    p_subjects TEXT[] DEFAULT ARRAY[]::TEXT[],
    p_grade_levels TEXT[] DEFAULT ARRAY[]::TEXT[]
) RETURNS UUID AS $$
DECLARE
    v_tutor_id UUID;
    v_subject TEXT;
    v_profile_exists BOOLEAN;
BEGIN
    -- Validate user exists and has correct role
    SELECT EXISTS(
        SELECT 1 FROM profiles 
        WHERE id = p_user_id 
        AND school_id = p_school_id 
        AND role IN ('student', 'teacher')
    ) INTO v_profile_exists;
    
    IF NOT v_profile_exists THEN
        RAISE EXCEPTION 'User does not exist or does not have permission to be a tutor';
    END IF;
    
    -- Check if tutor profile already exists
    SELECT id INTO v_tutor_id 
    FROM tutor_profiles 
    WHERE user_id = p_user_id AND school_id = p_school_id;
    
    IF v_tutor_id IS NOT NULL THEN
        RAISE EXCEPTION 'Tutor profile already exists for this user';
    END IF;
    
    -- Create tutor profile
    INSERT INTO tutor_profiles (
        user_id,
        school_id,
        bio,
        hourly_rate,
        status
    ) VALUES (
        p_user_id,
        p_school_id,
        COALESCE(p_bio, 'Passionate about helping students learn and succeed.'),
        p_hourly_rate,
        'pending_approval'
    ) RETURNING id INTO v_tutor_id;
    
    -- Add subjects if provided
    IF array_length(p_subjects, 1) > 0 THEN
        FOREACH v_subject IN ARRAY p_subjects LOOP
            INSERT INTO tutor_subjects (
                tutor_id,
                subject,
                grade_levels,
                proficiency_level,
                is_primary
            ) VALUES (
                v_tutor_id,
                v_subject,
                p_grade_levels,
                'intermediate',
                true
            );
        END LOOP;
    END IF;
    
    RETURN v_tutor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update tutor profile safely
CREATE OR REPLACE FUNCTION update_tutor_profile(
    p_tutor_id UUID,
    p_user_id UUID,
    p_bio TEXT DEFAULT NULL,
    p_hourly_rate DECIMAL DEFAULT NULL,
    p_availability_schedule JSONB DEFAULT NULL,
    p_is_available BOOLEAN DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    -- Verify tutor profile belongs to user
    SELECT EXISTS(
        SELECT 1 FROM tutor_profiles 
        WHERE id = p_tutor_id AND user_id = p_user_id
    ) INTO v_exists;
    
    IF NOT v_exists THEN
        RAISE EXCEPTION 'Tutor profile not found or access denied';
    END IF;
    
    -- Update profile
    UPDATE tutor_profiles SET
        bio = COALESCE(p_bio, bio),
        hourly_rate = COALESCE(p_hourly_rate, hourly_rate),
        availability_schedule = COALESCE(p_availability_schedule, availability_schedule),
        is_available = COALESCE(p_is_available, is_available),
        updated_at = NOW()
    WHERE id = p_tutor_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE tutor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutoring_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutoring_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutoring_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutoring_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutoring_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutoring_preferences ENABLE ROW LEVEL SECURITY;

-- Sample data using safe function
-- Example of how to create tutor profiles safely:
-- SELECT create_tutor_profile(
--     (SELECT id FROM profiles WHERE role = 'student' AND grade_level = '12' LIMIT 1),
--     (SELECT id FROM schools LIMIT 1),
--     'Experienced in mathematics and physics. Helped 20+ students improve their grades.',
--     25.00,
--     ARRAY['Mathematics', 'Physics'],
--     ARRAY['10', '11', '12']
-- );

-- Safe sample data insertion (commented out - uncomment when profiles exist)
/*
DO $$
DECLARE
    v_user_id UUID;
    v_school_id UUID;
    v_tutor_id UUID;
BEGIN
    -- Get a valid user and school
    SELECT id INTO v_user_id FROM profiles WHERE role = 'student' AND grade_level = '12' LIMIT 1;
    SELECT id INTO v_school_id FROM schools LIMIT 1;
    
    -- Only create if user and school exist
    IF v_user_id IS NOT NULL AND v_school_id IS NOT NULL THEN
        SELECT create_tutor_profile(
            v_user_id,
            v_school_id,
            'Experienced in mathematics and physics. Helped 20+ students improve their grades.',
            25.00,
            ARRAY['Mathematics', 'Physics'],
            ARRAY['10', '11', '12']
        ) INTO v_tutor_id;
        
        RAISE NOTICE 'Created tutor profile with ID: %', v_tutor_id;
    ELSE
        RAISE NOTICE 'No valid user or school found for sample data';
    END IF;
END;
$$;
*/

-- Safe sample tutor subjects insertion (commented out - uncomment when tutor profiles exist)
/*
-- Example of how to add subjects to existing tutors:
INSERT INTO tutor_subjects (tutor_id, subject, grade_levels, proficiency_level, is_primary) 
SELECT 
    tp.id,
    'Mathematics',
    ARRAY['9', '10', '11'],
    'expert',
    true
FROM tutor_profiles tp 
WHERE tp.user_id IN (SELECT id FROM profiles WHERE role = 'student' LIMIT 1);

-- Or use this safer approach:
DO $$
DECLARE
    v_tutor_id UUID;
BEGIN
    -- Get first tutor profile
    SELECT id INTO v_tutor_id FROM tutor_profiles LIMIT 1;
    
    -- Only insert if tutor exists
    IF v_tutor_id IS NOT NULL THEN
        INSERT INTO tutor_subjects (tutor_id, subject, grade_levels, proficiency_level, is_primary) VALUES
        (v_tutor_id, 'Mathematics', ARRAY['9', '10', '11'], 'expert', true),
        (v_tutor_id, 'Physics', ARRAY['10', '11'], 'advanced', false);
        
        RAISE NOTICE 'Added subjects for tutor: %', v_tutor_id;
    ELSE
        RAISE NOTICE 'No tutor profiles found - create tutors first';
    END IF;
END;
$$;
*/
