-- CatalystWells Developer Console - Enhanced Schema
-- This extends the existing schema with all required tables

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- SCOPE DEFINITIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS scope_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope_name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- profile, student, teacher, parent, school, calendar, ai
    risk_level VARCHAR(20) DEFAULT 'low', -- low, medium, high, critical
    data_accessed TEXT[], -- Human-readable list of data accessed
    is_premium BOOLEAN DEFAULT false,
    requires_consent BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert all education-specific scopes
INSERT INTO scope_definitions (scope_name, display_name, description, category, risk_level, data_accessed, requires_consent) VALUES
-- Profile Scopes
('profile.read', 'Read Basic Profile', 'Access basic profile information including name, avatar, and role', 'profile', 'low', ARRAY['Name', 'Avatar', 'Role', 'School'], true),
('profile.email', 'Read Email Address', 'Access the user''s email address', 'profile', 'medium', ARRAY['Email address'], true),

-- Student Scopes
('student.profile.read', 'Read Student Profile', 'Access student profile details', 'student', 'low', ARRAY['Student name', 'Grade', 'Section', 'Avatar'], true),
('student.attendance.read', 'Read Attendance Records', 'Access student attendance history and patterns', 'student', 'medium', ARRAY['Attendance records', 'Absence history', 'Late arrivals'], true),
('student.academic.read', 'Read Academic Records', 'Access grades, marks, and academic performance', 'student', 'medium', ARRAY['Grades', 'Marks', 'GPA', 'Academic history'], true),
('student.assessments.read', 'Read Assessment Data', 'Access exam results and assessment scores', 'student', 'medium', ARRAY['Exam results', 'Quiz scores', 'Assessment feedback'], true),
('student.timetable.read', 'Read Timetable', 'Access class schedules and timetables', 'student', 'low', ARRAY['Class schedule', 'Subject timings', 'Teacher assignments'], true),
('student.wellbeing.read', 'Read Wellbeing Data', 'Access wellbeing metrics and emotional state (aggregated)', 'student', 'high', ARRAY['Mood trends', 'Wellbeing scores', 'Check-in summaries'], true),
('student.notifications.send', 'Send Student Notifications', 'Send notifications to students', 'student', 'medium', ARRAY['Push notifications', 'In-app messages'], true),
('student.assignments.read', 'Read Assignments', 'Access assignment details and submissions', 'student', 'low', ARRAY['Assignments', 'Due dates', 'Submission status'], true),
('student.homework.read', 'Read Homework', 'Access homework assignments', 'student', 'low', ARRAY['Homework', 'Due dates', 'Completion status'], true),

-- Teacher Scopes
('teacher.profile.read', 'Read Teacher Profile', 'Access teacher profile information', 'teacher', 'low', ARRAY['Teacher name', 'Department', 'Subjects'], true),
('teacher.classes.read', 'Read Assigned Classes', 'Access classes assigned to the teacher', 'teacher', 'low', ARRAY['Class assignments', 'Student rosters'], true),
('teacher.students.read', 'Read Student Information', 'Access information about students in assigned classes', 'teacher', 'medium', ARRAY['Student profiles', 'Contact info'], true),

-- Parent Scopes
('parent.profile.read', 'Read Parent Profile', 'Access parent profile information', 'parent', 'low', ARRAY['Parent name', 'Contact info'], true),
('parent.children.read', 'Read Children Information', 'Access linked children profiles', 'parent', 'medium', ARRAY['Children names', 'Grades', 'Schools'], true),
('parent.grades.read', 'Read Children Grades', 'Access academic grades of linked children', 'parent', 'medium', ARRAY['Children grades', 'Progress reports'], true),
('parent.communications.read', 'Read Communications', 'Access messages from teachers and school', 'parent', 'low', ARRAY['Messages', 'Announcements'], true),

-- School Scopes
('school.structure.read', 'Read School Structure', 'Access school hierarchy and organization', 'school', 'low', ARRAY['Grades', 'Sections', 'Departments'], true),
('school.calendar.read', 'Read Academic Calendar', 'Access academic year and term information', 'school', 'low', ARRAY['Terms', 'Holidays', 'Events'], true),
('school.classes.read', 'Read Class Information', 'Access class rosters and details', 'school', 'low', ARRAY['Class details', 'Subject assignments'], true),

-- Calendar Scopes
('calendar.read', 'Read Calendar Events', 'Access calendar and scheduled events', 'calendar', 'low', ARRAY['Events', 'Schedules'], true),

-- AI Scopes
('ai.insights.read', 'Read AI Insights', 'Access AI-generated academic insights', 'ai', 'medium', ARRAY['Learning patterns', 'Performance predictions'], true),
('ai.recommendations.read', 'Read AI Recommendations', 'Access AI study recommendations', 'ai', 'low', ARRAY['Study tips', 'Resource suggestions'], true)

ON CONFLICT (scope_name) DO NOTHING;

-- ============================================
-- WEBHOOK DELIVERIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID NOT NULL REFERENCES application_webhooks(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    
    -- Delivery details
    attempt_number INTEGER DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, success, failed, retrying
    http_status_code INTEGER,
    response_body TEXT,
    response_headers JSONB,
    error_message TEXT,
    
    -- Timing
    sent_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    
    -- Retry
    next_retry_at TIMESTAMP WITH TIME ZONE,
    max_retries INTEGER DEFAULT 5,
    
    -- Signature
    signature VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- DEVELOPER NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS developer_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id UUID NOT NULL REFERENCES developer_accounts(id) ON DELETE CASCADE,
    
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- info, warning, error, success
    category VARCHAR(50), -- app_status, security, billing, announcement, system
    
    action_url TEXT,
    action_label VARCHAR(100),
    
    metadata JSONB,
    
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TEAM MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS developer_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_account_id UUID NOT NULL REFERENCES developer_accounts(id) ON DELETE CASCADE,
    member_user_id UUID NOT NULL, -- References auth.users
    
    role VARCHAR(50) NOT NULL DEFAULT 'developer', -- owner, admin, developer, analyst
    
    invited_by UUID REFERENCES developer_accounts(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    
    is_active BOOLEAN DEFAULT true,
    
    permissions JSONB DEFAULT '{}',
    
    last_activity_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(developer_account_id, member_user_id)
);

-- ============================================
-- TEAM INVITATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS developer_team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_account_id UUID NOT NULL REFERENCES developer_accounts(id) ON DELETE CASCADE,
    
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'developer',
    
    invited_by UUID NOT NULL REFERENCES developer_accounts(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, expired, cancelled
    
    accepted_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SCHOOL APP LINKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS school_app_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES developer_applications(id) ON DELETE CASCADE,
    school_id UUID NOT NULL, -- References schools in main DB
    
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, suspended
    
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    requested_by UUID NOT NULL REFERENCES developer_accounts(id),
    
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID, -- School admin user
    review_notes TEXT,
    
    allowed_scopes TEXT[] DEFAULT '{}',
    
    is_enabled BOOLEAN DEFAULT true,
    
    -- Usage stats
    total_api_calls BIGINT DEFAULT 0,
    last_api_call_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(application_id, school_id)
);

-- ============================================
-- SANDBOX DATA TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sandbox_schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50), -- primary, secondary, high_school
    student_count INTEGER DEFAULT 0,
    teacher_count INTEGER DEFAULT 0,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- APP MARKETPLACE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS app_marketplace (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID UNIQUE NOT NULL REFERENCES developer_applications(id) ON DELETE CASCADE,
    
    -- Listing
    tagline VARCHAR(200),
    long_description TEXT,
    screenshots TEXT[] DEFAULT '{}',
    demo_video_url TEXT,
    
    -- Categorization
    primary_category VARCHAR(100),
    secondary_category VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    
    -- Pricing
    pricing_model VARCHAR(50) DEFAULT 'free', -- free, paid, freemium
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    
    -- Stats
    install_count INTEGER DEFAULT 0,
    rating_average DECIMAL(2,1) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    
    -- Status
    is_listed BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    
    -- Versions
    current_version VARCHAR(50),
    
    listed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- APP REVIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS app_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES developer_applications(id) ON DELETE CASCADE,
    
    reviewer_id UUID NOT NULL, -- User who reviewed
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    review_text TEXT,
    
    is_verified_user BOOLEAN DEFAULT false,
    
    -- Moderation
    is_approved BOOLEAN DEFAULT true,
    is_flagged BOOLEAN DEFAULT false,
    moderation_notes TEXT,
    
    helpful_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(application_id, reviewer_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created ON webhook_deliveries(created_at);

CREATE INDEX IF NOT EXISTS idx_dev_notifications_developer ON developer_notifications(developer_id);
CREATE INDEX IF NOT EXISTS idx_dev_notifications_read ON developer_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_dev_notifications_created ON developer_notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_team_members_account ON developer_team_members(developer_account_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON developer_team_members(member_user_id);

CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON developer_team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON developer_team_invitations(token);

CREATE INDEX IF NOT EXISTS idx_school_links_app ON school_app_links(application_id);
CREATE INDEX IF NOT EXISTS idx_school_links_school ON school_app_links(school_id);
CREATE INDEX IF NOT EXISTS idx_school_links_status ON school_app_links(status);

CREATE INDEX IF NOT EXISTS idx_marketplace_category ON app_marketplace(primary_category);
CREATE INDEX IF NOT EXISTS idx_marketplace_listed ON app_marketplace(is_listed);
CREATE INDEX IF NOT EXISTS idx_marketplace_featured ON app_marketplace(is_featured);

CREATE INDEX IF NOT EXISTS idx_app_reviews_app ON app_reviews(application_id);
CREATE INDEX IF NOT EXISTS idx_app_reviews_rating ON app_reviews(rating);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE scope_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_app_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE sandbox_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_marketplace ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_reviews ENABLE ROW LEVEL SECURITY;

-- Scope definitions - public read
CREATE POLICY "Anyone can read active scopes"
    ON scope_definitions FOR SELECT
    USING (is_active = true);

-- Webhook deliveries - developer can view own
CREATE POLICY "Developers can view own webhook deliveries"
    ON webhook_deliveries FOR SELECT
    USING (webhook_id IN (
        SELECT w.id FROM application_webhooks w
        JOIN developer_applications a ON w.application_id = a.id
        WHERE a.developer_id IN (
            SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
        )
    ));

-- Developer notifications
CREATE POLICY "Developers can view own notifications"
    ON developer_notifications FOR SELECT
    USING (developer_id IN (
        SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "Developers can update own notifications"
    ON developer_notifications FOR UPDATE
    USING (developer_id IN (
        SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
    ));

-- Team members
CREATE POLICY "Developers can view team members"
    ON developer_team_members FOR SELECT
    USING (developer_account_id IN (
        SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
    ));

-- Team invitations
CREATE POLICY "Developers can manage team invitations"
    ON developer_team_invitations FOR ALL
    USING (developer_account_id IN (
        SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
    ));

-- School links
CREATE POLICY "Developers can manage school links"
    ON school_app_links FOR ALL
    USING (application_id IN (
        SELECT id FROM developer_applications 
        WHERE developer_id IN (
            SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
        )
    ));

-- Sandbox schools - everyone can read
CREATE POLICY "Anyone can read sandbox schools"
    ON sandbox_schools FOR SELECT
    USING (true);

-- Marketplace - public listings
CREATE POLICY "Anyone can read listed apps"
    ON app_marketplace FOR SELECT
    USING (is_listed = true);

CREATE POLICY "Developers can manage own marketplace listing"
    ON app_marketplace FOR ALL
    USING (application_id IN (
        SELECT id FROM developer_applications 
        WHERE developer_id IN (
            SELECT id FROM developer_accounts WHERE auth_user_id = auth.uid()
        )
    ));

-- App reviews - public read
CREATE POLICY "Anyone can read approved reviews"
    ON app_reviews FOR SELECT
    USING (is_approved = true);

-- ============================================
-- SEED SANDBOX DATA
-- ============================================
INSERT INTO sandbox_schools (name, code, type, student_count, teacher_count, data) VALUES
('Demo Primary School', 'DEMO-PRI-001', 'primary', 250, 15, '{"grades": ["1", "2", "3", "4", "5"], "sections": ["A", "B"]}'),
('Demo High School', 'DEMO-HIGH-001', 'high_school', 500, 30, '{"grades": ["9", "10", "11", "12"], "sections": ["A", "B", "C"]}'),
('Sandbox International Academy', 'SAND-INT-001', 'secondary', 350, 25, '{"grades": ["6", "7", "8"], "sections": ["A", "B"]}'),
('Test Elementary School', 'TEST-ELEM-001', 'primary', 180, 12, '{"grades": ["K", "1", "2", "3", "4"], "sections": ["A"]}'),
('Sample Secondary School', 'SAMP-SEC-001', 'secondary', 420, 28, '{"grades": ["6", "7", "8", "9", "10"], "sections": ["A", "B", "C"]}')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Enhanced Developer Portal Schema Created Successfully!';
    RAISE NOTICE '📊 New Tables: scope_definitions, webhook_deliveries, developer_notifications';
    RAISE NOTICE '👥 Team Management: developer_team_members, developer_team_invitations';
    RAISE NOTICE '🏫 School Linking: school_app_links';
    RAISE NOTICE '🏪 Marketplace: app_marketplace, app_reviews';
    RAISE NOTICE '🧪 Sandbox: sandbox_schools (5 demo schools seeded)';
    RAISE NOTICE '🔒 RLS Policies: Applied to all new tables';
END $$;
