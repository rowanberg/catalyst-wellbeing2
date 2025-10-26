-- Migration: Create assessments and assessment_grades tables
-- Description: Creates the core tables needed for the grade entry system
-- Run this in your Supabase SQL Editor

-- Create assessments table
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('quiz', 'test', 'assignment', 'project', 'exam')),
    max_score INTEGER NOT NULL CHECK (max_score > 0),
    pass_mark INTEGER NOT NULL DEFAULT 50 CHECK (pass_mark >= 0),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    rubric_criteria JSONB,
    answer_key JSONB,
    due_date TIMESTAMP WITH TIME ZONE,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add constraint to ensure pass_mark is not greater than max_score
    CONSTRAINT check_pass_mark_valid CHECK (pass_mark <= max_score)
);

-- Create assessment_grades table
CREATE TABLE IF NOT EXISTS assessment_grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    score DECIMAL(10,2) NOT NULL CHECK (score >= 0),
    percentage DECIMAL(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    letter_grade TEXT NOT NULL CHECK (letter_grade IN ('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F')),
    feedback TEXT,
    rubric_scores JSONB,
    submission_data JSONB,
    is_excused BOOLEAN DEFAULT false,
    late_penalty DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one grade per student per assessment
    UNIQUE(student_id, assessment_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assessments_teacher_id ON assessments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assessments_school_id ON assessments(school_id);
CREATE INDEX IF NOT EXISTS idx_assessments_class_id ON assessments(class_id);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_assessment_grades_student_id ON assessment_grades(student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_grades_assessment_id ON assessment_grades(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_grades_teacher_id ON assessment_grades(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assessment_grades_school_id ON assessment_grades(school_id);

-- Enable Row Level Security
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_grades ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Teachers can view their own assessments" ON assessments;
DROP POLICY IF EXISTS "Teachers can create assessments" ON assessments;
DROP POLICY IF EXISTS "Teachers can update their own assessments" ON assessments;
DROP POLICY IF EXISTS "Teachers can delete their own assessments" ON assessments;
DROP POLICY IF EXISTS "Teachers can view grades for their assessments" ON assessment_grades;
DROP POLICY IF EXISTS "Teachers can create grades" ON assessment_grades;
DROP POLICY IF EXISTS "Teachers can update grades" ON assessment_grades;
DROP POLICY IF EXISTS "Teachers can delete grades" ON assessment_grades;

-- RLS Policies for assessments table
CREATE POLICY "Teachers can view their own assessments"
    ON assessments FOR SELECT
    TO authenticated
    USING (
        teacher_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
            AND profiles.school_id = assessments.school_id
        )
    );

CREATE POLICY "Teachers can create assessments"
    ON assessments FOR INSERT
    TO authenticated
    WITH CHECK (
        teacher_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'teacher'
        )
    );

CREATE POLICY "Teachers can update their own assessments"
    ON assessments FOR UPDATE
    TO authenticated
    USING (teacher_id = auth.uid())
    WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete their own assessments"
    ON assessments FOR DELETE
    TO authenticated
    USING (teacher_id = auth.uid());

-- RLS Policies for assessment_grades table
CREATE POLICY "Teachers can view grades for their assessments"
    ON assessment_grades FOR SELECT
    TO authenticated
    USING (
        teacher_id = auth.uid()
        OR student_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
            AND profiles.school_id = assessment_grades.school_id
        )
    );

CREATE POLICY "Teachers can create grades"
    ON assessment_grades FOR INSERT
    TO authenticated
    WITH CHECK (
        teacher_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM assessments
            WHERE assessments.id = assessment_grades.assessment_id
            AND assessments.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Teachers can update grades"
    ON assessment_grades FOR UPDATE
    TO authenticated
    USING (teacher_id = auth.uid())
    WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete grades"
    ON assessment_grades FOR DELETE
    TO authenticated
    USING (teacher_id = auth.uid());

-- Grant permissions
GRANT ALL ON assessments TO authenticated;
GRANT ALL ON assessment_grades TO authenticated;

-- Add comments
COMMENT ON TABLE assessments IS 'Stores teacher-created assessments (quizzes, tests, assignments, etc.)';
COMMENT ON TABLE assessment_grades IS 'Stores student grades for assessments';
COMMENT ON COLUMN assessments.pass_mark IS 'Minimum score required to pass the assessment';
COMMENT ON COLUMN assessments.rubric_criteria IS 'JSON structure for rubric-based grading';
COMMENT ON COLUMN assessment_grades.percentage IS 'Calculated percentage score (0-100)';
