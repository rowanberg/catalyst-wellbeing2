-- Project Showcase Database Schema
-- This schema supports student project sharing, collaboration, and community engagement

-- Main projects table
CREATE TABLE IF NOT EXISTS student_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Project basic information
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500), -- For previews and cards
    project_type VARCHAR(30) CHECK (project_type IN (
        'academic', 'creative', 'technical', 'research', 'community_service', 
        'entrepreneurship', 'art', 'science', 'engineering', 'social_impact', 'other'
    )) NOT NULL,
    
    -- Academic context
    subject VARCHAR(100),
    grade_level VARCHAR(10),
    course_name VARCHAR(100),
    teacher_id UUID REFERENCES profiles(id),
    assignment_context TEXT, -- What assignment this was for
    
    -- Project details
    objectives TEXT[], -- What the project aimed to achieve
    methodology TEXT, -- How the project was approached
    tools_used TEXT[], -- Software, materials, equipment used
    skills_demonstrated TEXT[], -- Skills showcased in the project
    challenges_faced TEXT[], -- Obstacles and how they were overcome
    lessons_learned TEXT[], -- Key takeaways and insights
    
    -- Timeline and effort
    start_date DATE,
    end_date DATE,
    estimated_hours INTEGER, -- Time invested in the project
    
    -- Media and documentation
    cover_image_url TEXT,
    banner_image_url TEXT,
    demo_video_url TEXT,
    presentation_url TEXT,
    documentation_url TEXT,
    
    -- Project links and resources
    live_demo_url TEXT, -- For web projects, apps, etc.
    source_code_url TEXT, -- GitHub, GitLab, etc.
    external_links JSONB DEFAULT '[]', -- [{name: "Research Paper", url: "..."}]
    
    -- Collaboration and team
    is_team_project BOOLEAN DEFAULT false,
    team_members UUID[] DEFAULT '{}', -- Other student collaborators
    team_roles JSONB DEFAULT '{}', -- {user_id: "role description", ...}
    external_collaborators TEXT[], -- Non-student collaborators
    
    -- Visibility and sharing
    visibility VARCHAR(20) CHECK (visibility IN ('private', 'school_only', 'public', 'featured')) DEFAULT 'school_only',
    allow_comments BOOLEAN DEFAULT true,
    allow_collaboration BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    featured_until TIMESTAMPTZ,
    
    -- Status and completion
    status VARCHAR(20) CHECK (status IN ('draft', 'in_progress', 'completed', 'published', 'archived')) DEFAULT 'draft',
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    
    -- Engagement metrics
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    
    -- Awards and recognition
    awards_received TEXT[], -- Any awards or recognition
    competition_entries JSONB DEFAULT '[]', -- Competitions this project was entered in
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    keywords TEXT[] DEFAULT '{}', -- For search optimization
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

-- Project media and attachments
CREATE TABLE IF NOT EXISTS project_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES student_projects(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Media details
    media_type VARCHAR(20) CHECK (media_type IN ('image', 'video', 'audio', 'document', 'code', 'other')) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER, -- in bytes
    file_format VARCHAR(10),
    
    -- Display information
    title VARCHAR(200),
    description TEXT,
    alt_text VARCHAR(500), -- For accessibility
    
    -- Organization
    display_order INTEGER DEFAULT 0,
    is_cover_image BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    
    -- Media metadata
    dimensions JSONB, -- {width: 1920, height: 1080} for images/videos
    duration_seconds INTEGER, -- For video/audio
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project updates and progress logs
CREATE TABLE IF NOT EXISTS project_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES student_projects(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Update content
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    update_type VARCHAR(20) CHECK (update_type IN (
        'progress', 'milestone', 'challenge', 'solution', 'reflection', 'announcement', 'completion'
    )) DEFAULT 'progress',
    
    -- Progress tracking
    progress_percentage INTEGER CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    milestones_completed TEXT[],
    next_steps TEXT[],
    
    -- Media attachments
    attached_media UUID[] DEFAULT '{}', -- References to project_media
    
    -- Visibility
    is_public BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project comments and feedback
CREATE TABLE IF NOT EXISTS project_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES student_projects(id) ON DELETE CASCADE,
    commenter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Comment content
    comment_text TEXT NOT NULL,
    comment_type VARCHAR(20) CHECK (comment_type IN (
        'feedback', 'question', 'suggestion', 'praise', 'critique', 'collaboration_request'
    )) DEFAULT 'feedback',
    
    -- Threading
    parent_comment_id UUID REFERENCES project_comments(id) ON DELETE CASCADE,
    
    -- Reactions and engagement
    like_count INTEGER DEFAULT 0,
    is_helpful BOOLEAN DEFAULT false, -- Marked as helpful by project creator
    
    -- Moderation
    is_approved BOOLEAN DEFAULT true,
    is_flagged BOOLEAN DEFAULT false,
    moderated_by UUID REFERENCES profiles(id),
    moderation_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project likes and reactions
CREATE TABLE IF NOT EXISTS project_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES student_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) CHECK (reaction_type IN ('like', 'love', 'wow', 'inspiring', 'helpful')) DEFAULT 'like',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(project_id, user_id)
);

-- Project categories and collections
CREATE TABLE IF NOT EXISTS project_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_type VARCHAR(30) CHECK (category_type IN (
        'subject_based', 'skill_based', 'grade_level', 'project_type', 'competition', 'featured'
    )) NOT NULL,
    
    -- Visual design
    icon_name VARCHAR(50),
    color_theme VARCHAR(7) DEFAULT '#3B82F6',
    banner_image_url TEXT,
    
    -- Organization
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    
    -- Filtering criteria
    filter_criteria JSONB DEFAULT '{}', -- Automatic categorization rules
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(school_id, name)
);

-- Project category assignments
CREATE TABLE IF NOT EXISTS project_category_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES student_projects(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES project_categories(id) ON DELETE CASCADE,
    
    -- Assignment details
    assigned_by VARCHAR(20) CHECK (assigned_by IN ('creator', 'teacher', 'admin', 'automatic')) DEFAULT 'creator',
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(project_id, category_id)
);

-- Project competitions and challenges
CREATE TABLE IF NOT EXISTS project_competitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    organizer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Competition details
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    theme VARCHAR(200), -- Competition theme or focus
    competition_type VARCHAR(30) CHECK (competition_type IN (
        'innovation', 'science_fair', 'art_showcase', 'coding_challenge', 
        'social_impact', 'entrepreneurship', 'design_thinking', 'research'
    )) NOT NULL,
    
    -- Rules and requirements
    rules TEXT,
    submission_requirements JSONB NOT NULL, -- What must be included in submissions
    judging_criteria JSONB NOT NULL, -- How projects will be evaluated
    
    -- Eligibility
    eligible_grades TEXT[] DEFAULT '{}',
    eligible_subjects TEXT[] DEFAULT '{}',
    max_team_size INTEGER DEFAULT 1,
    
    -- Timeline
    registration_start TIMESTAMPTZ NOT NULL,
    registration_end TIMESTAMPTZ NOT NULL,
    submission_deadline TIMESTAMPTZ NOT NULL,
    judging_period_start TIMESTAMPTZ NOT NULL,
    judging_period_end TIMESTAMPTZ NOT NULL,
    results_announcement TIMESTAMPTZ NOT NULL,
    
    -- Participation
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    entry_fee DECIMAL(8,2) DEFAULT 0.00,
    
    -- Prizes and recognition
    prizes JSONB DEFAULT '[]', -- Prize structure and rewards
    certificates_awarded BOOLEAN DEFAULT true,
    
    -- Status
    status VARCHAR(20) CHECK (status IN (
        'draft', 'registration_open', 'registration_closed', 'submission_period', 
        'judging', 'completed', 'cancelled'
    )) DEFAULT 'draft',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competition submissions
CREATE TABLE IF NOT EXISTS competition_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID NOT NULL REFERENCES project_competitions(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES student_projects(id) ON DELETE CASCADE,
    submitter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Submission details
    submission_title VARCHAR(200), -- May differ from project title
    submission_description TEXT,
    
    -- Competition-specific information
    category VARCHAR(100), -- Competition category if applicable
    presentation_notes TEXT, -- Notes for judges/presentation
    
    -- Status and timing
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    is_late BOOLEAN DEFAULT false,
    
    -- Judging and results
    judge_scores JSONB DEFAULT '{}', -- {judge_id: {criteria1: score, ...}}
    final_score DECIMAL(8,2),
    rank_position INTEGER,
    award_received VARCHAR(100),
    
    -- Feedback
    judge_feedback TEXT,
    public_feedback TEXT, -- Feedback visible to all
    
    UNIQUE(competition_id, project_id)
);

-- Project collaboration requests
CREATE TABLE IF NOT EXISTS project_collaboration_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES student_projects(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Request details
    message TEXT NOT NULL,
    proposed_role VARCHAR(100), -- What role they want to play
    skills_offered TEXT[], -- What they can contribute
    time_commitment VARCHAR(100), -- How much time they can dedicate
    
    -- Status
    status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'declined', 'withdrawn')) DEFAULT 'pending',
    response_message TEXT,
    responded_at TIMESTAMPTZ,
    responded_by UUID REFERENCES profiles(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project mentorship and guidance
CREATE TABLE IF NOT EXISTS project_mentorships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES student_projects(id) ON DELETE CASCADE,
    mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Mentorship details
    mentor_type VARCHAR(20) CHECK (mentor_type IN ('teacher', 'industry_expert', 'alumni', 'peer', 'volunteer')) NOT NULL,
    expertise_areas TEXT[], -- Areas where mentor can help
    
    -- Engagement
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    meeting_frequency VARCHAR(50), -- "Weekly", "Bi-weekly", "As needed"
    
    -- Communication
    preferred_communication VARCHAR(30) CHECK (preferred_communication IN ('in_person', 'video_call', 'email', 'chat')) DEFAULT 'video_call',
    
    -- Status
    status VARCHAR(20) CHECK (status IN ('active', 'completed', 'paused', 'cancelled')) DEFAULT 'active',
    
    -- Feedback and outcomes
    mentor_feedback TEXT,
    student_feedback TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project analytics and insights
CREATE TABLE IF NOT EXISTS project_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES student_projects(id) ON DELETE CASCADE,
    
    -- Time period for analytics
    date_period DATE NOT NULL,
    period_type VARCHAR(10) CHECK (period_type IN ('daily', 'weekly', 'monthly')) NOT NULL,
    
    -- Engagement metrics
    views INTEGER DEFAULT 0,
    unique_viewers INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    
    -- Interaction details
    average_view_duration_seconds INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0, -- Percentage who left quickly
    engagement_rate DECIMAL(5,2) DEFAULT 0, -- Likes + comments / views
    
    -- Audience insights
    viewer_demographics JSONB DEFAULT '{}', -- Grade levels, subjects of viewers
    traffic_sources JSONB DEFAULT '{}', -- How people found the project
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(project_id, date_period, period_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_projects_school ON student_projects(school_id);
CREATE INDEX IF NOT EXISTS idx_student_projects_creator ON student_projects(creator_id);
CREATE INDEX IF NOT EXISTS idx_student_projects_status ON student_projects(status);
CREATE INDEX IF NOT EXISTS idx_student_projects_visibility ON student_projects(visibility);
CREATE INDEX IF NOT EXISTS idx_student_projects_featured ON student_projects(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_student_projects_type ON student_projects(project_type);
CREATE INDEX IF NOT EXISTS idx_student_projects_subject ON student_projects(subject);
CREATE INDEX IF NOT EXISTS idx_student_projects_tags ON student_projects USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_student_projects_created ON student_projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_projects_published ON student_projects(published_at DESC) WHERE published_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_project_media_project ON project_media(project_id, display_order);
CREATE INDEX IF NOT EXISTS idx_project_updates_project ON project_updates(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_comments_project ON project_comments(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_likes_project ON project_likes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_likes_user ON project_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_project_categories_school ON project_categories(school_id);
CREATE INDEX IF NOT EXISTS idx_project_category_assignments_project ON project_category_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_category_assignments_category ON project_category_assignments(category_id);

CREATE INDEX IF NOT EXISTS idx_competition_submissions_competition ON competition_submissions(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_submissions_project ON competition_submissions(project_id);

-- Triggers for updated_at
CREATE TRIGGER update_student_projects_updated_at BEFORE UPDATE ON student_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_media_updated_at BEFORE UPDATE ON project_media FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_comments_updated_at BEFORE UPDATE ON project_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_categories_updated_at BEFORE UPDATE ON project_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_competitions_updated_at BEFORE UPDATE ON project_competitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_mentorships_updated_at BEFORE UPDATE ON project_mentorships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update project engagement metrics
CREATE OR REPLACE FUNCTION update_project_engagement()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'project_likes' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE student_projects 
            SET like_count = like_count + 1,
                updated_at = NOW()
            WHERE id = NEW.project_id;
            RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE student_projects 
            SET like_count = like_count - 1,
                updated_at = NOW()
            WHERE id = OLD.project_id;
            RETURN OLD;
        END IF;
    ELSIF TG_TABLE_NAME = 'project_comments' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE student_projects 
            SET comment_count = comment_count + 1,
                updated_at = NOW()
            WHERE id = NEW.project_id;
            RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE student_projects 
            SET comment_count = comment_count - 1,
                updated_at = NOW()
            WHERE id = OLD.project_id;
            RETURN OLD;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_project_likes 
    AFTER INSERT OR DELETE ON project_likes 
    FOR EACH ROW EXECUTE FUNCTION update_project_engagement();

CREATE TRIGGER trigger_update_project_comments 
    AFTER INSERT OR DELETE ON project_comments 
    FOR EACH ROW EXECUTE FUNCTION update_project_engagement();

-- Function to update competition participant count
CREATE OR REPLACE FUNCTION update_competition_participants()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE project_competitions 
        SET current_participants = current_participants + 1,
            updated_at = NOW()
        WHERE id = NEW.competition_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE project_competitions 
        SET current_participants = current_participants - 1,
            updated_at = NOW()
        WHERE id = OLD.competition_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_competition_participants 
    AFTER INSERT OR DELETE ON competition_submissions 
    FOR EACH ROW EXECUTE FUNCTION update_competition_participants();

-- RLS Policies
ALTER TABLE student_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_submissions ENABLE ROW LEVEL SECURITY;

-- Policies for student_projects
CREATE POLICY "Users can view published projects in their school" ON student_projects
    FOR SELECT USING (
        (visibility IN ('public', 'school_only') AND status = 'published') OR
        creator_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
        (SELECT id FROM profiles WHERE user_id = auth.uid()) = ANY(team_members)
    );

CREATE POLICY "Users can manage their own projects" ON student_projects
    FOR ALL USING (
        creator_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
        (SELECT id FROM profiles WHERE user_id = auth.uid()) = ANY(team_members)
    );

-- Sample data
INSERT INTO student_projects (school_id, creator_id, title, description, project_type, subject, status, visibility) VALUES
(
    (SELECT id FROM schools LIMIT 1),
    (SELECT id FROM profiles WHERE role = 'student' LIMIT 1),
    'Solar-Powered Water Purification System',
    'An innovative project combining renewable energy with water treatment technology to provide clean drinking water for rural communities. This system uses solar panels to power a multi-stage filtration process including UV sterilization.',
    'science',
    'Environmental Science',
    'published',
    'public'
),
(
    (SELECT id FROM schools LIMIT 1),
    (SELECT id FROM profiles WHERE role = 'student' LIMIT 1 OFFSET 1),
    'Interactive History Timeline Web App',
    'A dynamic web application that visualizes major historical events through an interactive timeline. Users can explore different time periods, view multimedia content, and understand connections between events.',
    'technical',
    'History',
    'published',
    'school_only'
),
(
    (SELECT id FROM schools LIMIT 1),
    (SELECT id FROM profiles WHERE role = 'student' LIMIT 1 OFFSET 2),
    'Community Garden Initiative',
    'A comprehensive project to establish and maintain a community garden that provides fresh produce to local food banks while teaching sustainable agriculture practices to fellow students.',
    'community_service',
    'Biology',
    'published',
    'public'
);

-- Insert project categories
INSERT INTO project_categories (school_id, name, description, category_type) VALUES
(
    (SELECT id FROM schools LIMIT 1),
    'STEM Innovation',
    'Projects showcasing innovation in Science, Technology, Engineering, and Mathematics',
    'subject_based'
),
(
    (SELECT id FROM schools LIMIT 1),
    'Social Impact',
    'Projects that address community needs and create positive social change',
    'project_type'
),
(
    (SELECT id FROM schools LIMIT 1),
    'Creative Arts',
    'Artistic and creative projects across various mediums and disciplines',
    'subject_based'
);
