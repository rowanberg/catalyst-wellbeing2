
-- ============================================================================
-- COMPREHENSIVE ASSESSMENTS & GRADES SYSTEM - PART 1
-- Core Tables and Structure
-- ============================================================================
-- This file creates all necessary tables for the teacher assessments/update results page
-- Run this file first before part 2 (which contains functions, triggers, and policies)
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CORE ASSESSMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Information
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('quiz', 'test', 'assignment', 'project', 'exam', 'homework', 'lab', 'presentation')),
    subject VARCHAR(100), -- e.g., 'Mathematics', 'Science', 'English'
    
    -- Scoring
    max_score DECIMAL(10,2) NOT NULL CHECK (max_score > 0),
    passing_score DECIMAL(10,2),
    weight DECIMAL(5,2) DEFAULT 1.0, -- For weighted grades
    
    -- Relationships
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    -- Assessment Configuration
    rubric_criteria JSONB, -- For rubric-based assessments
    answer_key JSONB, -- For OMR/automated grading
    grading_scale JSONB, -- Custom grading scale if needed
    
    -- Dates
    due_date TIMESTAMP WITH TIME ZONE,
    assigned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Status
    is_published BOOLEAN DEFAULT false,
    is_graded BOOLEAN DEFAULT false,
    allow_late_submission BOOLEAN DEFAULT true,
    
    -- Metadata
    total_students INTEGER DEFAULT 0,
    graded_count INTEGER DEFAULT 0,
    average_score DECIMAL(5,2),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ASSESSMENT GRADES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS assessment_grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    
    -- Scores
    score DECIMAL(10,2) NOT NULL CHECK (score >= 0),
    percentage DECIMAL(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    letter_grade TEXT NOT NULL CHECK (letter_grade IN ('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'I', 'W')),
    grade_points DECIMAL(3,2), -- GPA calculation
    
    -- Feedback
    feedback TEXT,
    teacher_comments TEXT,
    rubric_scores JSONB, -- Individual rubric criteria scores
    
    -- Submission Details
    submission_data JSONB, -- For digital submissions
    submission_date TIMESTAMP WITH TIME ZONE,
    graded_date TIMESTAMP WITH TIME ZONE,
    
    -- Status Flags
    is_excused BOOLEAN DEFAULT false,
    is_late BOOLEAN DEFAULT false,
    is_missing BOOLEAN DEFAULT false,
    late_penalty DECIMAL(5,2) DEFAULT 0,
    bonus_points DECIMAL(5,2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one grade per student per assessment
    UNIQUE(student_id, assessment_id)
);

-- ============================================================================
-- GRADE TEMPLATES TABLE (for quick feedback)
-- ============================================================================
CREATE TABLE IF NOT EXISTS grade_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Ownership
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    -- Template Details
    template_name TEXT NOT NULL,
    feedback_text TEXT NOT NULL,
    category TEXT CHECK (category IN ('positive', 'improvement', 'concern', 'excellent', 'needs_work', 'missing_work')),
    shortcut_key VARCHAR(10), -- e.g., 'Ctrl+1' for quick access
    
    -- Configuration
    is_active BOOLEAN DEFAULT true,
    use_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- OFFLINE GRADE SYNC TABLE (for offline capability)
-- ============================================================================
CREATE TABLE IF NOT EXISTS offline_grade_sync (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    -- Sync Data
    grade_data JSONB NOT NULL, -- Contains all grade information
    operation_type TEXT CHECK (operation_type IN ('create', 'update', 'delete')),
    
    -- Sync Status
    sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed', 'conflict')),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- ASSESSMENT ANALYTICS TABLE (for insights)
-- ============================================================================
CREATE TABLE IF NOT EXISTS assessment_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    -- Statistics
    total_students INTEGER DEFAULT 0,
    submitted_count INTEGER DEFAULT 0,
    graded_count INTEGER DEFAULT 0,
    missing_count INTEGER DEFAULT 0,
    
    -- Score Distribution
    average_score DECIMAL(5,2),
    median_score DECIMAL(5,2),
    highest_score DECIMAL(10,2),
    lowest_score DECIMAL(10,2),
    std_deviation DECIMAL(5,2),
    
    -- Grade Distribution
    grade_distribution JSONB, -- {'A': 5, 'B': 10, 'C': 8, ...}
    score_ranges JSONB, -- Distribution by score ranges
    
    -- Performance Insights
    difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'moderate', 'challenging', 'very_difficult')),
    completion_rate DECIMAL(5,2),
    
    -- Timestamps
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- GRADING RUBRICS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS grading_rubrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    -- Rubric Details
    rubric_name TEXT NOT NULL,
    description TEXT,
    subject VARCHAR(100),
    
    -- Criteria
    criteria JSONB NOT NULL, -- Array of {name, description, max_points, levels: [{points, description}]}
    total_points INTEGER NOT NULL,
    
    -- Configuration
    is_template BOOLEAN DEFAULT false,
    is_shared BOOLEAN DEFAULT false,
    
    -- Usage Stats
    use_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Assessments indexes
CREATE INDEX IF NOT EXISTS idx_assessments_teacher_id ON assessments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assessments_class_id ON assessments(class_id);
CREATE INDEX IF NOT EXISTS idx_assessments_school_id ON assessments(school_id);
CREATE INDEX IF NOT EXISTS idx_assessments_type ON assessments(type);
CREATE INDEX IF NOT EXISTS idx_assessments_is_published ON assessments(is_published);
CREATE INDEX IF NOT EXISTS idx_assessments_due_date ON assessments(due_date);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments(created_at DESC);

-- Assessment grades indexes
CREATE INDEX IF NOT EXISTS idx_assessment_grades_student_id ON assessment_grades(student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_grades_assessment_id ON assessment_grades(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_grades_teacher_id ON assessment_grades(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assessment_grades_school_id ON assessment_grades(school_id);
CREATE INDEX IF NOT EXISTS idx_assessment_grades_class_id ON assessment_grades(class_id);
CREATE INDEX IF NOT EXISTS idx_assessment_grades_letter_grade ON assessment_grades(letter_grade);
CREATE INDEX IF NOT EXISTS idx_assessment_grades_is_missing ON assessment_grades(is_missing);
CREATE INDEX IF NOT EXISTS idx_assessment_grades_created_at ON assessment_grades(created_at DESC);

-- Grade templates indexes
CREATE INDEX IF NOT EXISTS idx_grade_templates_teacher_id ON grade_templates(teacher_id);
CREATE INDEX IF NOT EXISTS idx_grade_templates_school_id ON grade_templates(school_id);
CREATE INDEX IF NOT EXISTS idx_grade_templates_category ON grade_templates(category);
CREATE INDEX IF NOT EXISTS idx_grade_templates_is_active ON grade_templates(is_active);

-- Offline sync indexes
CREATE INDEX IF NOT EXISTS idx_offline_grade_sync_teacher_id ON offline_grade_sync(teacher_id);
CREATE INDEX IF NOT EXISTS idx_offline_grade_sync_status ON offline_grade_sync(sync_status);
CREATE INDEX IF NOT EXISTS idx_offline_grade_sync_created_at ON offline_grade_sync(created_at DESC);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_assessment_analytics_assessment_id ON assessment_analytics(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_analytics_class_id ON assessment_analytics(class_id);
CREATE INDEX IF NOT EXISTS idx_assessment_analytics_school_id ON assessment_analytics(school_id);

-- Rubrics indexes
CREATE INDEX IF NOT EXISTS idx_grading_rubrics_teacher_id ON grading_rubrics(teacher_id);
CREATE INDEX IF NOT EXISTS idx_grading_rubrics_school_id ON grading_rubrics(school_id);
CREATE INDEX IF NOT EXISTS idx_grading_rubrics_is_template ON grading_rubrics(is_template);

-- ============================================================================
-- COMPOSITE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_assessments_teacher_school ON assessments(teacher_id, school_id);
CREATE INDEX IF NOT EXISTS idx_assessments_class_published ON assessments(class_id, is_published);
CREATE INDEX IF NOT EXISTS idx_assessment_grades_student_assessment ON assessment_grades(student_id, assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_grades_assessment_class ON assessment_grades(assessment_id, class_id);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ PART 1 COMPLETE: Core assessment tables created successfully!';
    RAISE NOTICE 'Tables created: assessments, assessment_grades, grade_templates, offline_grade_sync, assessment_analytics, grading_rubrics';
    RAISE NOTICE 'Next step: Run comprehensive_assessments_part2.sql for functions, triggers, and RLS policies';
END $$;
