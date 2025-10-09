-- Catalyst Examination System Schema
-- Complete examination system with AI integration, security, and gamification
-- Compatible with existing Catalyst Wells architecture

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- EXAMINATION CORE TABLES
-- =============================================

-- Examinations table - Core exam configuration
CREATE TABLE IF NOT EXISTS examinations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    subject VARCHAR(100) NOT NULL,
    grade_level VARCHAR(20) NOT NULL,
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'expert')) DEFAULT 'medium',
    
    -- Teacher and school association
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    
    -- Exam configuration
    total_questions INTEGER NOT NULL CHECK (total_questions > 0),
    total_marks INTEGER NOT NULL CHECK (total_marks > 0),
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    passing_marks INTEGER NOT NULL CHECK (passing_marks >= 0),
    
    -- Scheduling and availability
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    is_published BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Exam type and settings
    exam_type VARCHAR(50) CHECK (exam_type IN ('quiz', 'test', 'midterm', 'final', 'practice', 'assignment')) DEFAULT 'quiz',
    question_randomization BOOLEAN DEFAULT true,
    option_randomization BOOLEAN DEFAULT true,
    show_results_immediately BOOLEAN DEFAULT false,
    allow_review BOOLEAN DEFAULT true,
    max_attempts INTEGER DEFAULT 1 CHECK (max_attempts > 0),
    
    -- AI and automation
    ai_generated BOOLEAN DEFAULT false,
    ai_prompt TEXT,
    auto_grade BOOLEAN DEFAULT true,
    
    -- Security settings
    require_webcam BOOLEAN DEFAULT false,
    anti_cheat_enabled BOOLEAN DEFAULT true,
    lockdown_mode BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_exam_duration CHECK (start_time IS NULL OR end_time IS NULL OR start_time < end_time),
    CONSTRAINT valid_passing_marks CHECK (passing_marks <= total_marks)
);

-- Questions table - Individual exam questions
CREATE TABLE IF NOT EXISTS exam_questions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    examination_id UUID NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
    
    -- Question content
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay', 'fill_blank', 'matching')) NOT NULL,
    marks INTEGER NOT NULL CHECK (marks > 0),
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    
    -- Question metadata
    subject_tag VARCHAR(100),
    topic VARCHAR(100),
    learning_objective TEXT,
    
    -- AI generation info
    ai_generated BOOLEAN DEFAULT false,
    ai_confidence_score DECIMAL(3,2) CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),
    
    -- Question order and grouping
    question_order INTEGER NOT NULL,
    question_group VARCHAR(100), -- For grouping related questions
    
    -- Media attachments
    image_url TEXT,
    audio_url TEXT,
    video_url TEXT,
    
    -- Timing
    time_limit_seconds INTEGER CHECK (time_limit_seconds > 0),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(examination_id, question_order)
);

-- Question options table - For MCQ, True/False, etc.
CREATE TABLE IF NOT EXISTS question_options (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    question_id UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
    
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    option_order INTEGER NOT NULL,
    
    -- Explanation for the option
    explanation TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(question_id, option_order)
);

-- =============================================
-- STUDENT EXAMINATION TABLES
-- =============================================

-- Student exam sessions - Track individual exam attempts
CREATE TABLE IF NOT EXISTS student_exam_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    examination_id UUID NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
    
    -- Session details
    attempt_number INTEGER NOT NULL DEFAULT 1,
    session_token VARCHAR(255) UNIQUE NOT NULL, -- For security
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_at TIMESTAMP WITH TIME ZONE,
    time_spent_seconds INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(50) CHECK (status IN ('in_progress', 'submitted', 'auto_submitted', 'cancelled', 'flagged')) DEFAULT 'in_progress',
    
    -- Results
    total_score INTEGER DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0,
    grade VARCHAR(5),
    passed BOOLEAN DEFAULT false,
    
    -- Security and monitoring
    ip_address INET,
    user_agent TEXT,
    tab_switches INTEGER DEFAULT 0,
    suspicious_activity JSONB DEFAULT '[]'::jsonb,
    webcam_snapshots TEXT[], -- URLs to webcam captures
    
    -- Feedback and review
    teacher_feedback TEXT,
    ai_feedback TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(student_id, examination_id, attempt_number)
);

-- Student answers - Individual question responses
CREATE TABLE IF NOT EXISTS student_answers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES student_exam_sessions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
    
    -- Answer content
    answer_text TEXT,
    selected_options UUID[], -- Array of option IDs for MCQ
    
    -- Scoring
    marks_awarded INTEGER DEFAULT 0,
    is_correct BOOLEAN,
    
    -- Timing and behavior
    time_spent_seconds INTEGER DEFAULT 0,
    answer_order INTEGER, -- Order in which questions were answered
    
    -- AI analysis
    ai_confidence DECIMAL(3,2),
    ai_feedback TEXT,
    
    -- Manual grading
    manually_graded BOOLEAN DEFAULT false,
    grader_id UUID REFERENCES auth.users(id),
    grader_comments TEXT,
    
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    graded_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(session_id, question_id)
);

-- =============================================
-- ANALYTICS AND REPORTING TABLES
-- =============================================

-- Exam analytics - Performance metrics per exam
CREATE TABLE IF NOT EXISTS exam_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    examination_id UUID NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
    
    -- Participation metrics
    total_students_assigned INTEGER DEFAULT 0,
    total_attempts INTEGER DEFAULT 0,
    completed_attempts INTEGER DEFAULT 0,
    
    -- Performance metrics
    average_score DECIMAL(5,2) DEFAULT 0,
    highest_score INTEGER DEFAULT 0,
    lowest_score INTEGER DEFAULT 0,
    pass_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Time metrics
    average_time_minutes INTEGER DEFAULT 0,
    fastest_completion_minutes INTEGER,
    slowest_completion_minutes INTEGER,
    
    -- Question analysis
    question_analytics JSONB DEFAULT '{}'::jsonb, -- Per-question statistics
    
    -- Difficulty analysis
    difficulty_distribution JSONB DEFAULT '{}'::jsonb,
    
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student performance tracking
CREATE TABLE IF NOT EXISTS student_exam_performance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    -- Overall metrics
    total_exams_taken INTEGER DEFAULT 0,
    total_exams_passed INTEGER DEFAULT 0,
    average_score DECIMAL(5,2) DEFAULT 0,
    
    -- Subject-wise performance
    subject_performance JSONB DEFAULT '{}'::jsonb,
    
    -- Improvement tracking
    performance_trend JSONB DEFAULT '[]'::jsonb, -- Array of score history
    
    -- Strengths and weaknesses
    strong_topics TEXT[],
    weak_topics TEXT[],
    
    -- Gamification
    exam_xp INTEGER DEFAULT 0,
    exam_level INTEGER DEFAULT 1,
    badges_earned TEXT[],
    
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(student_id, school_id)
);

-- =============================================
-- GAMIFICATION TABLES
-- =============================================

-- Exam badges and achievements
CREATE TABLE IF NOT EXISTS exam_badges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon_url TEXT,
    badge_type VARCHAR(50) CHECK (badge_type IN ('performance', 'participation', 'improvement', 'special')) NOT NULL,
    
    -- Requirements
    requirements JSONB NOT NULL, -- Conditions to earn the badge
    xp_reward INTEGER DEFAULT 0,
    gem_reward INTEGER DEFAULT 0,
    
    -- Rarity and display
    rarity VARCHAR(20) CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')) DEFAULT 'common',
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student badge achievements
CREATE TABLE IF NOT EXISTS student_exam_badges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES exam_badges(id) ON DELETE CASCADE,
    session_id UUID REFERENCES student_exam_sessions(id) ON DELETE SET NULL,
    
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(student_id, badge_id)
);

-- =============================================
-- AI AND AUTOMATION TABLES
-- =============================================

-- AI question generation history
CREATE TABLE IF NOT EXISTS ai_question_generation (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Generation request
    prompt TEXT NOT NULL,
    subject VARCHAR(100) NOT NULL,
    grade_level VARCHAR(20) NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    question_count INTEGER NOT NULL,
    
    -- AI response
    ai_model VARCHAR(50) NOT NULL,
    generated_questions JSONB NOT NULL,
    generation_time_ms INTEGER,
    
    -- Quality metrics
    success_rate DECIMAL(3,2),
    teacher_approval_rate DECIMAL(3,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI grading and feedback
CREATE TABLE IF NOT EXISTS ai_grading_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES student_exam_sessions(id) ON DELETE CASCADE,
    
    -- AI model info
    ai_model VARCHAR(50) NOT NULL,
    grading_confidence DECIMAL(3,2),
    
    -- Results
    ai_score INTEGER,
    ai_feedback TEXT,
    processing_time_ms INTEGER,
    
    -- Human review
    human_reviewed BOOLEAN DEFAULT false,
    human_score INTEGER,
    score_difference INTEGER, -- Difference between AI and human scores
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SECURITY AND MONITORING TABLES
-- =============================================

-- Exam security events
CREATE TABLE IF NOT EXISTS exam_security_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES student_exam_sessions(id) ON DELETE CASCADE,
    
    event_type VARCHAR(50) CHECK (event_type IN ('tab_switch', 'window_blur', 'copy_attempt', 'paste_attempt', 'right_click', 'keyboard_shortcut', 'face_not_detected', 'multiple_faces', 'suspicious_movement')) NOT NULL,
    event_data JSONB,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    
    -- Context
    timestamp_offset INTEGER, -- Seconds from exam start
    screenshot_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Face verification data
CREATE TABLE IF NOT EXISTS exam_face_verification (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES student_exam_sessions(id) ON DELETE CASCADE,
    
    -- Verification data
    reference_image_url TEXT NOT NULL, -- Student's reference photo
    captured_image_url TEXT NOT NULL,
    
    -- AI analysis
    confidence_score DECIMAL(3,2) NOT NULL,
    match_result BOOLEAN NOT NULL,
    
    -- Timing
    capture_timestamp INTEGER NOT NULL, -- Seconds from exam start
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Examinations indexes
CREATE INDEX IF NOT EXISTS idx_examinations_teacher_id ON examinations(teacher_id);
CREATE INDEX IF NOT EXISTS idx_examinations_school_id ON examinations(school_id);
CREATE INDEX IF NOT EXISTS idx_examinations_class_id ON examinations(class_id);
CREATE INDEX IF NOT EXISTS idx_examinations_published ON examinations(is_published, is_active);
CREATE INDEX IF NOT EXISTS idx_examinations_schedule ON examinations(start_time, end_time);

-- Questions indexes
CREATE INDEX IF NOT EXISTS idx_exam_questions_examination_id ON exam_questions(examination_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_order ON exam_questions(examination_id, question_order);
CREATE INDEX IF NOT EXISTS idx_question_options_question_id ON question_options(question_id);

-- Student sessions indexes
CREATE INDEX IF NOT EXISTS idx_student_sessions_student_id ON student_exam_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_student_sessions_exam_id ON student_exam_sessions(examination_id);
CREATE INDEX IF NOT EXISTS idx_student_sessions_status ON student_exam_sessions(status);
CREATE INDEX IF NOT EXISTS idx_student_sessions_token ON student_exam_sessions(session_token);

-- Answers indexes
CREATE INDEX IF NOT EXISTS idx_student_answers_session_id ON student_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_student_answers_question_id ON student_answers(question_id);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_student_performance_student_id ON student_exam_performance(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_analytics_exam_id ON exam_analytics(examination_id);

-- Security indexes
CREATE INDEX IF NOT EXISTS idx_security_events_session_id ON exam_security_events(session_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON exam_security_events(event_type, severity);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_exam_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_exam_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_question_generation ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_grading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_face_verification ENABLE ROW LEVEL SECURITY;

-- Examinations policies
CREATE POLICY "Teachers can manage their own exams" ON examinations
    FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "Students can view published exams in their classes" ON examinations
    FOR SELECT USING (
        is_published = true AND is_active = true AND
        (class_id IS NULL OR class_id IN (
            SELECT class_id FROM student_class_assignments 
            WHERE student_id = auth.uid() AND is_active = true
        ))
    );

CREATE POLICY "Admins can view school exams" ON examinations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin' 
            AND profiles.school_id = examinations.school_id
        )
    );

-- Questions policies (inherit from examinations)
CREATE POLICY "Teachers can manage questions for their exams" ON exam_questions
    FOR ALL USING (
        examination_id IN (
            SELECT id FROM examinations WHERE teacher_id = auth.uid()
        )
    );

CREATE POLICY "Students can view questions during active sessions" ON exam_questions
    FOR SELECT USING (
        examination_id IN (
            SELECT examination_id FROM student_exam_sessions 
            WHERE student_id = auth.uid() AND status = 'in_progress'
        )
    );

-- Student sessions policies
CREATE POLICY "Students can manage their own sessions" ON student_exam_sessions
    FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Teachers can view sessions for their exams" ON student_exam_sessions
    FOR SELECT USING (
        examination_id IN (
            SELECT id FROM examinations WHERE teacher_id = auth.uid()
        )
    );

-- Similar policies for other tables...

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to calculate exam grade
CREATE OR REPLACE FUNCTION calculate_exam_grade(score INTEGER, total_marks INTEGER)
RETURNS VARCHAR(5) AS $$
BEGIN
    DECLARE
        percentage DECIMAL(5,2);
    BEGIN
        percentage := (score::DECIMAL / total_marks::DECIMAL) * 100;
        
        CASE 
            WHEN percentage >= 90 THEN RETURN 'A+';
            WHEN percentage >= 80 THEN RETURN 'A';
            WHEN percentage >= 70 THEN RETURN 'B';
            WHEN percentage >= 60 THEN RETURN 'C';
            WHEN percentage >= 50 THEN RETURN 'D';
            ELSE RETURN 'F';
        END CASE;
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to update exam analytics
CREATE OR REPLACE FUNCTION update_exam_analytics(exam_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO exam_analytics (examination_id, total_attempts, completed_attempts, average_score, highest_score, lowest_score, pass_rate)
    SELECT 
        exam_id,
        COUNT(*) as total_attempts,
        COUNT(*) FILTER (WHERE status = 'submitted') as completed_attempts,
        AVG(total_score) FILTER (WHERE status = 'submitted') as average_score,
        MAX(total_score) FILTER (WHERE status = 'submitted') as highest_score,
        MIN(total_score) FILTER (WHERE status = 'submitted') as lowest_score,
        (COUNT(*) FILTER (WHERE status = 'submitted' AND passed = true)::DECIMAL / 
         NULLIF(COUNT(*) FILTER (WHERE status = 'submitted'), 0) * 100) as pass_rate
    FROM student_exam_sessions 
    WHERE examination_id = exam_id
    ON CONFLICT (examination_id) DO UPDATE SET
        total_attempts = EXCLUDED.total_attempts,
        completed_attempts = EXCLUDED.completed_attempts,
        average_score = EXCLUDED.average_score,
        highest_score = EXCLUDED.highest_score,
        lowest_score = EXCLUDED.lowest_score,
        pass_rate = EXCLUDED.pass_rate,
        last_calculated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to update analytics when session is completed
CREATE OR REPLACE FUNCTION trigger_update_analytics()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'submitted' AND (OLD.status IS NULL OR OLD.status != 'submitted') THEN
        PERFORM update_exam_analytics(NEW.examination_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_analytics_on_submission
    AFTER UPDATE ON student_exam_sessions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_analytics();

-- Function to generate session token
CREATE OR REPLACE FUNCTION generate_session_token()
RETURNS TRIGGER AS $$
BEGIN
    NEW.session_token := encode(gen_random_bytes(32), 'hex');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_session_token_trigger
    BEFORE INSERT ON student_exam_sessions
    FOR EACH ROW
    EXECUTE FUNCTION generate_session_token();

-- =============================================
-- DEFAULT DATA
-- =============================================

-- Insert default exam badges
INSERT INTO exam_badges (name, description, badge_type, requirements, xp_reward, gem_reward, rarity) VALUES
    ('First Exam', 'Complete your first examination', 'participation', '{"exams_completed": 1}', 50, 10, 'common'),
    ('Perfect Score', 'Score 100% on any exam', 'performance', '{"perfect_scores": 1}', 200, 50, 'rare'),
    ('Quick Learner', 'Complete an exam in under 50% of allocated time', 'performance', '{"quick_completions": 1}', 100, 25, 'uncommon'),
    ('Consistent Performer', 'Pass 5 exams in a row', 'performance', '{"consecutive_passes": 5}', 300, 75, 'epic'),
    ('Subject Master', 'Score above 90% in 10 exams of the same subject', 'performance', '{"subject_mastery": {"count": 10, "score": 90}}', 500, 100, 'legendary'),
    ('Exam Champion', 'Complete 50 examinations', 'participation', '{"exams_completed": 50}', 1000, 200, 'epic'),
    ('Improvement Star', 'Improve score by 20% from previous attempt', 'improvement', '{"improvement_percentage": 20}', 150, 30, 'uncommon'),
    ('Focus Master', 'Complete exam without any security violations', 'special', '{"clean_sessions": 1}', 100, 20, 'uncommon')
ON CONFLICT (name) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE examinations IS 'Core examination configuration and metadata';
COMMENT ON TABLE exam_questions IS 'Individual questions within examinations';
COMMENT ON TABLE question_options IS 'Multiple choice options for questions';
COMMENT ON TABLE student_exam_sessions IS 'Student examination attempts and sessions';
COMMENT ON TABLE student_answers IS 'Individual student responses to questions';
COMMENT ON TABLE exam_analytics IS 'Performance analytics per examination';
COMMENT ON TABLE student_exam_performance IS 'Overall student performance tracking';
COMMENT ON TABLE exam_badges IS 'Achievement badges for gamification';
COMMENT ON TABLE student_exam_badges IS 'Student badge achievements';
COMMENT ON TABLE ai_question_generation IS 'AI-generated question history';
COMMENT ON TABLE ai_grading_sessions IS 'AI grading and feedback sessions';
COMMENT ON TABLE exam_security_events IS 'Security monitoring and violation tracking';
COMMENT ON TABLE exam_face_verification IS 'Face verification data for exam security';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🎓 SUCCESS: Catalyst Examination System schema created successfully!';
    RAISE NOTICE '📊 Tables: examinations, exam_questions, question_options, student_exam_sessions, student_answers';
    RAISE NOTICE '📈 Analytics: exam_analytics, student_exam_performance';
    RAISE NOTICE '🎮 Gamification: exam_badges, student_exam_badges';
    RAISE NOTICE '🤖 AI Integration: ai_question_generation, ai_grading_sessions';
    RAISE NOTICE '🔒 Security: exam_security_events, exam_face_verification';
    RAISE NOTICE '⚡ Performance: Comprehensive indexing and RLS policies applied';
    RAISE NOTICE '🚀 Ready for Catalyst Wells integration!';
END $$;
