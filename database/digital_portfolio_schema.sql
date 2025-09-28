-- Digital Portfolio Database Schema
-- This schema supports comprehensive student portfolios with work samples, reflections, and progress tracking

-- Main portfolio structure for each student
CREATE TABLE IF NOT EXISTS student_portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    -- Portfolio metadata
    title VARCHAR(200) DEFAULT 'My Learning Portfolio',
    description TEXT,
    portfolio_type VARCHAR(30) CHECK (portfolio_type IN (
        'academic', 'creative', 'career', 'showcase', 'assessment', 'mixed'
    )) DEFAULT 'academic',
    
    -- Customization and branding
    theme_color VARCHAR(7) DEFAULT '#3B82F6',
    cover_image_url TEXT,
    layout_template VARCHAR(50) DEFAULT 'standard',
    custom_css TEXT,
    
    -- Privacy and sharing settings
    visibility VARCHAR(20) CHECK (visibility IN ('private', 'school_only', 'teachers_only', 'public')) DEFAULT 'school_only',
    allow_comments BOOLEAN DEFAULT true,
    allow_downloads BOOLEAN DEFAULT false,
    password_protected BOOLEAN DEFAULT false,
    access_password VARCHAR(100), -- Hashed password
    
    -- Portfolio organization
    sections JSONB DEFAULT '[]', -- [{id: "academics", name: "Academic Work", order: 1, visible: true}]
    navigation_style VARCHAR(20) CHECK (navigation_style IN ('sidebar', 'tabs', 'cards', 'timeline')) DEFAULT 'sidebar',
    
    -- Completion and requirements
    is_published BOOLEAN DEFAULT false,
    completion_percentage DECIMAL(5,2) DEFAULT 0.0,
    required_sections TEXT[] DEFAULT '{}', -- Sections required by school/teacher
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_viewed TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    
    UNIQUE(student_id, school_id)
);

-- Portfolio sections/categories
CREATE TABLE IF NOT EXISTS portfolio_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES student_portfolios(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    section_type VARCHAR(30) CHECK (section_type IN (
        'academic_work', 'projects', 'reflections', 'achievements', 'goals', 
        'skills', 'experiences', 'certifications', 'testimonials', 'custom'
    )) NOT NULL,
    
    -- Organization
    display_order INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    is_required BOOLEAN DEFAULT false,
    
    -- Section configuration
    max_items INTEGER, -- NULL for unlimited
    allowed_file_types TEXT[] DEFAULT ARRAY['pdf', 'doc', 'docx', 'jpg', 'png', 'mp4', 'mp3'],
    max_file_size_mb INTEGER DEFAULT 10,
    
    -- Display settings
    layout_style VARCHAR(20) CHECK (layout_style IN ('grid', 'list', 'timeline', 'carousel')) DEFAULT 'grid',
    items_per_row INTEGER DEFAULT 3,
    show_dates BOOLEAN DEFAULT true,
    show_descriptions BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual portfolio items/artifacts
CREATE TABLE IF NOT EXISTS portfolio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES student_portfolios(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES portfolio_sections(id) ON DELETE CASCADE,
    
    -- Item details
    title VARCHAR(200) NOT NULL,
    description TEXT,
    item_type VARCHAR(30) CHECK (item_type IN (
        'document', 'image', 'video', 'audio', 'link', 'text', 'presentation', 
        'code', 'artwork', 'assignment', 'project', 'reflection', 'goal'
    )) NOT NULL,
    
    -- File and content
    file_url TEXT,
    file_name VARCHAR(255),
    file_size INTEGER, -- in bytes
    file_format VARCHAR(10),
    thumbnail_url TEXT,
    
    -- Text content (for text-based items)
    content TEXT,
    content_format VARCHAR(20) CHECK (content_format IN ('plain', 'markdown', 'html')) DEFAULT 'plain',
    
    -- Academic context
    subject VARCHAR(100),
    assignment_name VARCHAR(200),
    grade_received VARCHAR(20),
    date_completed DATE,
    teacher_id UUID REFERENCES profiles(id),
    
    -- Learning evidence
    learning_objectives TEXT[],
    skills_demonstrated TEXT[],
    standards_addressed TEXT[], -- Curriculum standards
    
    -- Organization and display
    display_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    keywords TEXT[] DEFAULT '{}', -- For search
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    date_added TIMESTAMPTZ DEFAULT NOW()
);

-- Student reflections on portfolio items
CREATE TABLE IF NOT EXISTS portfolio_reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_item_id UUID NOT NULL REFERENCES portfolio_items(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Reflection content
    reflection_type VARCHAR(30) CHECK (reflection_type IN (
        'learning_process', 'challenges_overcome', 'skills_gained', 'future_goals', 
        'self_assessment', 'growth_evidence', 'connection_making', 'general'
    )) DEFAULT 'general',
    
    -- Guided reflection prompts and responses
    prompts_and_responses JSONB DEFAULT '[]', -- [{prompt: "What did you learn?", response: "I learned..."}]
    
    -- Free-form reflection
    reflection_text TEXT,
    
    -- Self-assessment
    effort_rating INTEGER CHECK (effort_rating >= 1 AND effort_rating <= 5),
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    learning_rating INTEGER CHECK (learning_rating >= 1 AND learning_rating <= 5),
    
    -- Growth tracking
    areas_of_strength TEXT[],
    areas_for_improvement TEXT[],
    next_steps TEXT[],
    
    -- Visibility
    is_visible BOOLEAN DEFAULT true,
    share_with_teachers BOOLEAN DEFAULT true,
    share_with_parents BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning goals and progress tracking
CREATE TABLE IF NOT EXISTS portfolio_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES student_portfolios(id) ON DELETE CASCADE,
    
    -- Goal details
    title VARCHAR(200) NOT NULL,
    description TEXT,
    goal_type VARCHAR(30) CHECK (goal_type IN (
        'academic', 'skill_development', 'personal_growth', 'career', 
        'creative', 'social', 'leadership', 'service'
    )) NOT NULL,
    
    -- Goal specifics
    subject VARCHAR(100),
    target_date DATE,
    priority_level VARCHAR(20) CHECK (priority_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    
    -- SMART goal components
    specific_outcome TEXT, -- What specifically will be achieved
    measurable_criteria TEXT[], -- How progress will be measured
    action_steps TEXT[], -- Steps to achieve the goal
    resources_needed TEXT[], -- What resources are required
    
    -- Progress tracking
    status VARCHAR(20) CHECK (status IN ('not_started', 'in_progress', 'completed', 'paused', 'cancelled')) DEFAULT 'not_started',
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    
    -- Evidence and artifacts
    evidence_items UUID[] DEFAULT '{}', -- Portfolio item IDs that demonstrate progress
    milestone_dates JSONB DEFAULT '[]', -- [{date: "2025-10-01", milestone: "Completed research phase"}]
    
    -- Reflection and assessment
    self_assessment_notes TEXT,
    teacher_feedback TEXT,
    parent_feedback TEXT,
    
    -- Completion details
    completed_date DATE,
    outcome_achieved TEXT,
    lessons_learned TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skills and competencies tracking
CREATE TABLE IF NOT EXISTS portfolio_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES student_portfolios(id) ON DELETE CASCADE,
    
    -- Skill details
    skill_name VARCHAR(100) NOT NULL,
    skill_category VARCHAR(50) CHECK (skill_category IN (
        'academic', 'technical', 'creative', 'communication', 'collaboration', 
        'critical_thinking', 'problem_solving', 'leadership', 'digital_literacy', 'other'
    )) NOT NULL,
    
    -- Proficiency tracking
    current_level VARCHAR(20) CHECK (current_level IN ('novice', 'developing', 'proficient', 'advanced', 'expert')) DEFAULT 'novice',
    target_level VARCHAR(20) CHECK (target_level IN ('novice', 'developing', 'proficient', 'advanced', 'expert')) DEFAULT 'proficient',
    
    -- Evidence and demonstration
    evidence_items UUID[] DEFAULT '{}', -- Portfolio item IDs that demonstrate this skill
    assessment_rubric JSONB, -- Rubric criteria and levels
    self_assessment_score INTEGER CHECK (self_assessment_score >= 1 AND self_assessment_score <= 4),
    teacher_assessment_score INTEGER CHECK (teacher_assessment_score >= 1 AND teacher_assessment_score <= 4),
    
    -- Progress tracking
    development_timeline JSONB DEFAULT '[]', -- [{date: "2025-09-01", level: "novice", evidence: "..."}]
    improvement_goals TEXT[],
    
    -- Context
    subject_areas TEXT[], -- Where this skill is applied
    real_world_applications TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(portfolio_id, skill_name)
);

-- Portfolio sharing and collaboration
CREATE TABLE IF NOT EXISTS portfolio_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES student_portfolios(id) ON DELETE CASCADE,
    shared_with_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    shared_with_email VARCHAR(255), -- For external sharing
    
    -- Sharing details
    share_type VARCHAR(20) CHECK (share_type IN ('view_only', 'comment', 'collaborate')) DEFAULT 'view_only',
    access_level VARCHAR(20) CHECK (access_level IN ('full', 'sections_only', 'items_only')) DEFAULT 'full',
    allowed_sections UUID[] DEFAULT '{}', -- Specific sections if not full access
    
    -- Sharing configuration
    expires_at TIMESTAMPTZ,
    requires_login BOOLEAN DEFAULT true,
    allow_download BOOLEAN DEFAULT false,
    
    -- Tracking
    share_token VARCHAR(100) UNIQUE, -- For anonymous sharing
    view_count INTEGER DEFAULT 0,
    last_viewed TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments and feedback on portfolios
CREATE TABLE IF NOT EXISTS portfolio_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID REFERENCES student_portfolios(id) ON DELETE CASCADE,
    portfolio_item_id UUID REFERENCES portfolio_items(id) ON DELETE CASCADE,
    commenter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Comment content
    comment_text TEXT NOT NULL,
    comment_type VARCHAR(20) CHECK (comment_type IN ('feedback', 'question', 'praise', 'suggestion', 'assessment')) DEFAULT 'feedback',
    
    -- Threading
    parent_comment_id UUID REFERENCES portfolio_comments(id) ON DELETE CASCADE,
    
    -- Assessment and scoring (for teacher comments)
    rubric_scores JSONB, -- {criteria1: score, criteria2: score, ...}
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    
    -- Visibility and moderation
    is_visible BOOLEAN DEFAULT true,
    is_private BOOLEAN DEFAULT false, -- Private between teacher and student
    requires_response BOOLEAN DEFAULT false,
    
    -- Status
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio templates and assignments
CREATE TABLE IF NOT EXISTS portfolio_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Template details
    name VARCHAR(200) NOT NULL,
    description TEXT,
    template_type VARCHAR(30) CHECK (template_type IN (
        'subject_specific', 'grade_level', 'project_based', 'assessment', 'showcase', 'general'
    )) NOT NULL,
    
    -- Target audience
    target_grades TEXT[] DEFAULT '{}',
    target_subjects TEXT[] DEFAULT '{}',
    
    -- Template structure
    default_sections JSONB NOT NULL, -- Predefined sections and their configurations
    required_items JSONB DEFAULT '[]', -- Required portfolio items
    reflection_prompts JSONB DEFAULT '[]', -- Suggested reflection questions
    
    -- Assessment criteria
    rubric JSONB, -- Assessment rubric for portfolios using this template
    completion_requirements JSONB DEFAULT '{}', -- What constitutes completion
    
    -- Customization
    allow_customization BOOLEAN DEFAULT true,
    locked_sections TEXT[] DEFAULT '{}', -- Sections that cannot be modified
    
    -- Usage and sharing
    is_public BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio assignments from teachers
CREATE TABLE IF NOT EXISTS portfolio_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    template_id UUID REFERENCES portfolio_templates(id) ON DELETE SET NULL,
    
    -- Assignment details
    title VARCHAR(200) NOT NULL,
    description TEXT,
    instructions TEXT,
    
    -- Targeting
    target_students UUID[] DEFAULT '{}', -- Specific students, empty for all
    target_classes UUID[] DEFAULT '{}', -- Specific classes
    target_grades TEXT[] DEFAULT '{}', -- Grade levels
    
    -- Requirements
    required_items INTEGER DEFAULT 0, -- Minimum number of items
    required_sections TEXT[] DEFAULT '{}',
    required_reflections INTEGER DEFAULT 0,
    
    -- Timing
    assigned_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    allow_late_submission BOOLEAN DEFAULT true,
    
    -- Assessment
    rubric_id UUID, -- Reference to assessment rubric
    points_possible INTEGER DEFAULT 100,
    weight_in_grade DECIMAL(5,2) DEFAULT 0.0,
    
    -- Status
    is_published BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student submissions for portfolio assignments
CREATE TABLE IF NOT EXISTS portfolio_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES portfolio_assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    portfolio_id UUID NOT NULL REFERENCES student_portfolios(id) ON DELETE CASCADE,
    
    -- Submission details
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    is_late BOOLEAN DEFAULT false,
    submission_notes TEXT,
    
    -- Assessment
    grade_received DECIMAL(5,2),
    points_earned DECIMAL(5,2),
    feedback TEXT,
    rubric_scores JSONB,
    
    -- Status
    status VARCHAR(20) CHECK (status IN ('draft', 'submitted', 'graded', 'returned', 'resubmitted')) DEFAULT 'draft',
    graded_at TIMESTAMPTZ,
    graded_by UUID REFERENCES profiles(id),
    
    UNIQUE(assignment_id, student_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_portfolios_student ON student_portfolios(student_id);
CREATE INDEX IF NOT EXISTS idx_student_portfolios_school ON student_portfolios(school_id);
CREATE INDEX IF NOT EXISTS idx_student_portfolios_published ON student_portfolios(is_published) WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_portfolio_sections_portfolio ON portfolio_sections(portfolio_id, display_order);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_portfolio ON portfolio_items(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_section ON portfolio_items(section_id, display_order);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_type ON portfolio_items(item_type);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_featured ON portfolio_items(is_featured) WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_portfolio_reflections_item ON portfolio_reflections(portfolio_item_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_goals_portfolio ON portfolio_goals(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_skills_portfolio ON portfolio_skills(portfolio_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_comments_portfolio ON portfolio_comments(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_comments_item ON portfolio_comments(portfolio_item_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_comments_commenter ON portfolio_comments(commenter_id);

-- Triggers for updated_at
CREATE TRIGGER update_student_portfolios_updated_at BEFORE UPDATE ON student_portfolios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_portfolio_sections_updated_at BEFORE UPDATE ON portfolio_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_portfolio_items_updated_at BEFORE UPDATE ON portfolio_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_portfolio_reflections_updated_at BEFORE UPDATE ON portfolio_reflections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_portfolio_goals_updated_at BEFORE UPDATE ON portfolio_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_portfolio_skills_updated_at BEFORE UPDATE ON portfolio_skills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_portfolio_comments_updated_at BEFORE UPDATE ON portfolio_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_portfolio_templates_updated_at BEFORE UPDATE ON portfolio_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_portfolio_assignments_updated_at BEFORE UPDATE ON portfolio_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update portfolio completion percentage
CREATE OR REPLACE FUNCTION update_portfolio_completion()
RETURNS TRIGGER AS $$
DECLARE
    total_required INTEGER;
    completed_items INTEGER;
    completion_pct DECIMAL(5,2);
BEGIN
    -- Calculate completion based on required sections and items
    SELECT 
        COUNT(*) INTO total_required
    FROM portfolio_sections 
    WHERE portfolio_id = COALESCE(NEW.portfolio_id, OLD.portfolio_id) 
    AND is_required = true;
    
    SELECT 
        COUNT(DISTINCT pi.section_id) INTO completed_items
    FROM portfolio_items pi
    JOIN portfolio_sections ps ON pi.section_id = ps.id
    WHERE pi.portfolio_id = COALESCE(NEW.portfolio_id, OLD.portfolio_id)
    AND ps.is_required = true
    AND pi.is_visible = true;
    
    -- Calculate percentage
    IF total_required > 0 THEN
        completion_pct := (completed_items::DECIMAL / total_required * 100);
    ELSE
        completion_pct := 100.0;
    END IF;
    
    -- Update portfolio
    UPDATE student_portfolios 
    SET 
        completion_percentage = completion_pct,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.portfolio_id, OLD.portfolio_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_portfolio_completion 
    AFTER INSERT OR UPDATE OR DELETE ON portfolio_items 
    FOR EACH ROW EXECUTE FUNCTION update_portfolio_completion();

-- RLS Policies
ALTER TABLE student_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_comments ENABLE ROW LEVEL SECURITY;

-- Policies for student_portfolios
CREATE POLICY "Students can manage their own portfolios" ON student_portfolios
    FOR ALL USING (
        student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Teachers can view portfolios in their school" ON student_portfolios
    FOR SELECT USING (
        school_id IN (SELECT school_id FROM profiles WHERE user_id = auth.uid() AND role = 'teacher')
    );

-- Sample data
INSERT INTO student_portfolios (student_id, school_id, title, description) VALUES
(
    (SELECT id FROM profiles WHERE role = 'student' LIMIT 1),
    (SELECT id FROM schools LIMIT 1),
    'My Academic Journey',
    'A collection of my best work and learning experiences throughout high school.'
),
(
    (SELECT id FROM profiles WHERE role = 'student' LIMIT 1 OFFSET 1),
    (SELECT id FROM schools LIMIT 1),
    'Creative Expressions',
    'Showcasing my artistic and creative projects across different subjects and mediums.'
);

-- Insert default sections for portfolios
INSERT INTO portfolio_sections (portfolio_id, name, description, section_type, display_order, is_required) VALUES
(
    (SELECT id FROM student_portfolios LIMIT 1),
    'Academic Achievements',
    'My best academic work and assignments',
    'academic_work',
    1,
    true
),
(
    (SELECT id FROM student_portfolios LIMIT 1),
    'Personal Reflections',
    'My thoughts on learning and growth',
    'reflections',
    2,
    true
),
(
    (SELECT id FROM student_portfolios LIMIT 1),
    'Future Goals',
    'My aspirations and plans for the future',
    'goals',
    3,
    false
);
